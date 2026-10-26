from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import MarketingAsset, AssetRevision, AuditRun, ApprovalRecord, User, AuditEvent
from app.enums import UserRole, AssetStatus, ApprovalDecision, AuditStatus, Severity
from app.security import get_current_user, require_roles
from app.schemas import ReviewQueueItem, ApprovalDecisionRequest, ApprovalRecordResponse

router = APIRouter(tags=["Human Review & Approval Workflow"])

@router.get("/reviews/queue", response_model=List[ReviewQueueItem])
async def get_review_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists assets awaiting compliance review or actively in review.
    """
    result = await db.execute(
        select(MarketingAsset)
        .where(
            MarketingAsset.organization_id == current_user.organization_id,
            MarketingAsset.status.in_([AssetStatus.IN_REVIEW, AssetStatus.AUDITED, AssetStatus.DRAFT])
        )
        .options(
            selectinload(MarketingAsset.author),
            selectinload(MarketingAsset.revisions).selectinload(AssetRevision.audit_runs)
        )
        .order_by(MarketingAsset.updated_at.desc())
    )
    assets = result.scalars().all()

    queue_items = []
    for a in assets:
        curr_rev = next((r for r in a.revisions if r.id == a.current_revision_id), None)
        if not curr_rev and a.revisions:
            curr_rev = max(a.revisions, key=lambda r: r.revision_number)

        latest_audit = curr_rev.audit_runs[-1] if (curr_rev and curr_rev.audit_runs) else None

        queue_items.append(ReviewQueueItem(
            asset_id=a.id,
            title=a.title,
            asset_type=a.asset_type,
            campaign_name=a.campaign_name,
            status=a.status,
            author_id=a.author_id,
            author_name=a.author.full_name if a.author else "Unknown",
            current_revision_id=curr_rev.id if curr_rev else "",
            revision_number=curr_rev.revision_number if curr_rev else 1,
            audit_status=latest_audit.status if latest_audit else None,
            critical_findings=latest_audit.critical_count if latest_audit else 0,
            high_findings=latest_audit.high_count if latest_audit else 0,
            medium_findings=latest_audit.medium_count if latest_audit else 0,
            submitted_at=a.updated_at
        ))

    return queue_items

@router.post("/assets/{asset_id}/submit", response_model=ReviewQueueItem)
async def submit_asset_for_review(
    asset_id: str,
    current_user: User = Depends(require_roles(UserRole.CONTENT_CREATOR, UserRole.BRAND_MANAGER, UserRole.CAMPAIGN_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MarketingAsset)
        .where(
            MarketingAsset.id == asset_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(
            selectinload(MarketingAsset.author),
            selectinload(MarketingAsset.revisions).selectinload(AssetRevision.audit_runs)
        )
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    asset.status = AssetStatus.IN_REVIEW
    asset.updated_at = datetime.utcnow()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="ASSET_SUBMITTED_FOR_REVIEW",
        entity_type="MarketingAsset",
        entity_id=asset.id,
        description=f"Asset '{asset.title}' submitted for human review by {current_user.full_name}",
        metadata_json={"current_revision_id": asset.current_revision_id}
    )
    db.add(event)
    await db.commit()

    curr_rev = next((r for r in asset.revisions if r.id == asset.current_revision_id), None)
    latest_audit = curr_rev.audit_runs[-1] if (curr_rev and curr_rev.audit_runs) else None

    return ReviewQueueItem(
        asset_id=asset.id,
        title=asset.title,
        asset_type=asset.asset_type,
        campaign_name=asset.campaign_name,
        status=asset.status,
        author_id=asset.author_id,
        author_name=asset.author.full_name if asset.author else "Unknown",
        current_revision_id=curr_rev.id if curr_rev else "",
        revision_number=curr_rev.revision_number if curr_rev else 1,
        audit_status=latest_audit.status if latest_audit else None,
        critical_findings=latest_audit.critical_count if latest_audit else 0,
        high_findings=latest_audit.high_count if latest_audit else 0,
        medium_findings=latest_audit.medium_count if latest_audit else 0,
        submitted_at=asset.updated_at
    )

@router.post("/assets/{asset_id}/decide", response_model=ApprovalRecordResponse)
async def decide_review(
    asset_id: str,
    payload: ApprovalDecisionRequest,
    current_user: User = Depends(require_roles(UserRole.REVIEWER_APPROVER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Maker-Checker Approval Gate:
    1. Maker != Checker: Content creator cannot approve their own submission!
    2. High/Critical audit findings strictly block APPROVAL!
    3. Mandatory decision reason recorded in immutable audit log.
    """
    result = await db.execute(
        select(MarketingAsset)
        .where(
            MarketingAsset.id == asset_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(
            selectinload(MarketingAsset.revisions).selectinload(AssetRevision.audit_runs)
        )
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    # 1. Maker-Checker separation of duties check
    if current_user.id == asset.author_id and current_user.role != UserRole.ORGANIZATION_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker-Checker Separation Violation: You cannot approve your own submitted asset. A separate Reviewer/Approver must sign off."
        )

    curr_rev = next((r for r in asset.revisions if r.id == asset.current_revision_id), None)
    if not curr_rev:
        raise HTTPException(status_code=400, detail="Asset has no active content revision.")

    latest_audit = curr_rev.audit_runs[-1] if curr_rev.audit_runs else None

    # 2. Hard Compliance Gate: High or Critical findings block approval
    if payload.decision == ApprovalDecision.APPROVED:
        if not latest_audit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve asset without running an automated compliance audit first."
            )
        if latest_audit.critical_count > 0 or latest_audit.high_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval Blocked by Compliance Gate: Active revision has {latest_audit.critical_count} Critical and {latest_audit.high_count} High unresolved findings. Content must be corrected before approval."
            )

    # Apply decision
    if payload.decision == ApprovalDecision.APPROVED:
        asset.status = AssetStatus.APPROVED
    elif payload.decision == ApprovalDecision.REJECTED:
        asset.status = AssetStatus.REJECTED
    elif payload.decision == ApprovalDecision.CHANGES_REQUESTED:
        asset.status = AssetStatus.CHANGES_REQUESTED

    asset.updated_at = datetime.utcnow()

    # 3. Create immutable approval record
    appr_record = ApprovalRecord(
        asset_id=asset.id,
        revision_id=curr_rev.id,
        audit_run_id=latest_audit.id if latest_audit else None,
        reviewer_id=current_user.id,
        decision=payload.decision,
        decision_reason=payload.decision_reason,
        separation_of_duties_verified=(current_user.id != asset.author_id)
    )
    db.add(appr_record)
    await db.flush()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="APPROVAL_DECISION_RECORDED",
        entity_type="ApprovalRecord",
        entity_id=appr_record.id,
        description=f"Reviewer {current_user.full_name} issued decision '{payload.decision.value}' for '{asset.title}' (v{curr_rev.revision_number}). Reason: {payload.decision_reason}",
        metadata_json={
            "decision": payload.decision.value,
            "revision_number": curr_rev.revision_number,
            "maker_checker_verified": appr_record.separation_of_duties_verified
        }
    )
    db.add(event)
    await db.commit()

    return ApprovalRecordResponse(
        id=appr_record.id,
        asset_id=appr_record.asset_id,
        revision_id=appr_record.revision_id,
        audit_run_id=appr_record.audit_run_id,
        reviewer_id=appr_record.reviewer_id,
        reviewer_name=current_user.full_name,
        decision=appr_record.decision,
        decision_reason=appr_record.decision_reason,
        separation_of_duties_verified=appr_record.separation_of_duties_verified,
        created_at=appr_record.created_at
    )
