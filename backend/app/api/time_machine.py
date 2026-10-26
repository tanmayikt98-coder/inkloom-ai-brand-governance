from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import MarketingAsset, AssetRevision, AuditRun, ExtractedClaim, AuditFinding, User, AuditEvent
from app.enums import UserRole, AssetStatus, AuditStatus
from app.security import get_current_user, require_roles
from app.schemas import RevisionResponse, TimeMachineComparisonResponse
from app.services.diff_engine import DiffEngine

router = APIRouter(tags=["Brand Time Machine"])

@router.get("/assets/{asset_id}/revisions", response_model=List[RevisionResponse])
async def list_asset_revisions(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AssetRevision)
        .join(MarketingAsset, AssetRevision.asset_id == MarketingAsset.id)
        .where(
            AssetRevision.asset_id == asset_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(selectinload(AssetRevision.author))
        .order_by(AssetRevision.revision_number.asc())
    )
    revs = result.scalars().all()
    return [
        RevisionResponse(
            id=r.id,
            asset_id=r.asset_id,
            revision_number=r.revision_number,
            content_text=r.content_text,
            change_summary=r.change_summary,
            author_id=r.author_id,
            author_name=r.author.full_name if r.author else None,
            created_at=r.created_at
        )
        for r in revs
    ]

@router.get("/time-machine/compare", response_model=TimeMachineComparisonResponse)
async def compare_revisions(
    base_rev_id: str = Query(..., description="Older baseline revision ID"),
    target_rev_id: str = Query(..., description="Newer target revision ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch base revision
    base_res = await db.execute(
        select(AssetRevision)
        .where(AssetRevision.id == base_rev_id)
        .options(
            selectinload(AssetRevision.claims),
            selectinload(AssetRevision.audit_runs).selectinload(AuditRun.findings)
        )
    )
    rev_a = base_res.scalars().first()

    # Fetch target revision
    target_res = await db.execute(
        select(AssetRevision)
        .where(AssetRevision.id == target_rev_id)
        .options(
            selectinload(AssetRevision.claims),
            selectinload(AssetRevision.audit_runs).selectinload(AuditRun.findings)
        )
    )
    rev_b = target_res.scalars().first()

    if not rev_a or not rev_b:
        raise HTTPException(status_code=404, detail="One or both revisions not found.")

    # 1. Text diff
    text_diff = DiffEngine.compute_text_diff(rev_a.content_text, rev_b.content_text)

    # 2. Claims diff
    claims_diff = DiffEngine.compare_claims(rev_a.claims, rev_b.claims)

    # 3. Findings diff
    audit_a = rev_a.audit_runs[-1] if rev_a.audit_runs else None
    audit_b = rev_b.audit_runs[-1] if rev_b.audit_runs else None
    findings_a = audit_a.findings if audit_a else []
    findings_b = audit_b.findings if audit_b else []

    findings_diff = DiffEngine.compare_findings(findings_a, findings_b)

    # 4. Approval validity: if content changed, earlier approval is invalidated
    is_approval_valid = (rev_a.content_text.strip() == rev_b.content_text.strip())
    re_review_required = not is_approval_valid

    # 5. Narrative summary
    explanation = DiffEngine.generate_narrative_explanation(claims_diff, findings_diff)

    return TimeMachineComparisonResponse(
        base_revision_id=rev_a.id,
        base_revision_number=rev_a.revision_number,
        target_revision_id=rev_b.id,
        target_revision_number=rev_b.revision_number,
        text_diff=text_diff,
        claims_diff=claims_diff,
        findings_diff=findings_diff,
        base_audit_status=audit_a.status if audit_a else None,
        target_audit_status=audit_b.status if audit_b else None,
        is_approval_valid=is_approval_valid,
        re_review_required=re_review_required,
        ai_generated_explanation=explanation
    )

@router.post("/assets/{asset_id}/restore/{revision_id}", response_model=RevisionResponse)
async def restore_revision(
    asset_id: str,
    revision_id: str,
    current_user: User = Depends(require_roles(UserRole.CONTENT_CREATOR, UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Restores an earlier revision by creating a NEW revision with its content.
    Never erases or rewrites intervening history.
    """
    res = await db.execute(
        select(MarketingAsset)
        .where(
            MarketingAsset.id == asset_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(selectinload(MarketingAsset.revisions).selectinload(AssetRevision.claims))
    )
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    target_rev = next((r for r in asset.revisions if r.id == revision_id), None)
    if not target_rev:
        raise HTTPException(status_code=404, detail="Target revision to restore was not found.")

    next_rev_num = len(asset.revisions) + 1
    new_rev = AssetRevision(
        asset_id=asset.id,
        revision_number=next_rev_num,
        content_text=target_rev.content_text,
        change_summary=f"Restored content from Revision {target_rev.revision_number} by {current_user.full_name} (Intervening revisions preserved).",
        author_id=current_user.id
    )
    db.add(new_rev)
    await db.flush()

    # Clone extracted claims to ensure impact graph preserves dependency lineage
    for c in getattr(target_rev, "claims", []):
        cloned_claim = ExtractedClaim(
            revision_id=new_rev.id,
            claim_text=c.claim_text,
            claim_type=c.claim_type,
            extracted_value=c.extracted_value,
            unit=c.unit,
            matched_fact_id=c.matched_fact_id
        )
        db.add(cloned_claim)
    await db.flush()

    asset.current_revision_id = new_rev.id
    asset.status = AssetStatus.DRAFT
    asset.updated_at = datetime.utcnow()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="REVISION_RESTORED",
        entity_type="AssetRevision",
        entity_id=new_rev.id,
        description=f"Revision {target_rev.revision_number} restored as new Revision {next_rev_num} on '{asset.title}'.",
        metadata_json={"restored_from": target_rev.revision_number, "new_revision": next_rev_num}
    )
    db.add(event)
    await db.commit()

    return RevisionResponse(
        id=new_rev.id,
        asset_id=new_rev.asset_id,
        revision_number=new_rev.revision_number,
        content_text=new_rev.content_text,
        change_summary=new_rev.change_summary,
        author_id=new_rev.author_id,
        author_name=current_user.full_name,
        created_at=new_rev.created_at
    )
