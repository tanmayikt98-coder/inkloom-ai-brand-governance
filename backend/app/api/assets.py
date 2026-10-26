from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Brand, MarketingAsset, AssetRevision, ExtractedClaim, User, AuditEvent
from app.enums import UserRole, AssetStatus, AssetType
from app.security import get_current_user, require_roles
from app.schemas import AssetResponse, AssetCreate, RevisionResponse, RevisionCreate
from app.services.claim_engine import ClaimExtractionEngine

router = APIRouter(tags=["Marketing Assets & Content Revisions"])

@router.get("/brands/{brand_id}/assets", response_model=List[AssetResponse])
async def list_assets(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    result = await db.execute(
        select(MarketingAsset)
        .where(MarketingAsset.brand_id == brand_id)
        .options(
            selectinload(MarketingAsset.author),
            selectinload(MarketingAsset.revisions)
        )
        .order_by(MarketingAsset.updated_at.desc())
    )
    assets = result.scalars().all()

    response_items = []
    for a in assets:
        latest_rev = next((r for r in a.revisions if r.id == a.current_revision_id), None)
        if not latest_rev and a.revisions:
            latest_rev = max(a.revisions, key=lambda r: r.revision_number)

        resp = AssetResponse(
            id=a.id,
            organization_id=a.organization_id,
            brand_id=a.brand_id,
            title=a.title,
            asset_type=a.asset_type,
            campaign_name=a.campaign_name,
            current_revision_id=a.current_revision_id,
            status=a.status,
            author_id=a.author_id,
            author_name=a.author.full_name if a.author else None,
            created_at=a.created_at,
            updated_at=a.updated_at,
            latest_content=latest_rev.content_text if latest_rev else None,
            latest_revision_number=latest_rev.revision_number if latest_rev else 1
        )
        response_items.append(resp)

    return response_items

@router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    current_user: User = Depends(get_current_user),
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
            selectinload(MarketingAsset.revisions)
        )
    )
    a = result.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Marketing asset not found.")

    latest_rev = next((r for r in a.revisions if r.id == a.current_revision_id), None)
    if not latest_rev and a.revisions:
        latest_rev = max(a.revisions, key=lambda r: r.revision_number)

    return AssetResponse(
        id=a.id,
        organization_id=a.organization_id,
        brand_id=a.brand_id,
        title=a.title,
        asset_type=a.asset_type,
        campaign_name=a.campaign_name,
        current_revision_id=a.current_revision_id,
        status=a.status,
        author_id=a.author_id,
        author_name=a.author.full_name if a.author else None,
        created_at=a.created_at,
        updated_at=a.updated_at,
        latest_content=latest_rev.content_text if latest_rev else None,
        latest_revision_number=latest_rev.revision_number if latest_rev else 1
    )

@router.post("/brands/{brand_id}/assets", response_model=AssetResponse)
async def create_asset(
    brand_id: str,
    payload: AssetCreate,
    current_user: User = Depends(require_roles(UserRole.CONTENT_CREATOR, UserRole.BRAND_MANAGER, UserRole.CAMPAIGN_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    new_asset = MarketingAsset(
        organization_id=current_user.organization_id,
        brand_id=brand_id,
        title=payload.title,
        asset_type=payload.asset_type,
        campaign_name=payload.campaign_name or "General",
        status=AssetStatus.DRAFT,
        author_id=current_user.id
    )
    db.add(new_asset)
    await db.flush()

    # Automatically create Revision 1
    rev1 = AssetRevision(
        asset_id=new_asset.id,
        revision_number=1,
        content_text=payload.content_text,
        change_summary="Initial asset draft created.",
        author_id=current_user.id
    )
    db.add(rev1)
    await db.flush()

    new_asset.current_revision_id = rev1.id

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="ASSET_CREATED",
        entity_type="MarketingAsset",
        entity_id=new_asset.id,
        description=f"Marketing asset '{new_asset.title}' created by {current_user.full_name}",
        metadata_json={"asset_type": new_asset.asset_type.value, "revision": 1}
    )
    db.add(event)
    await db.commit()

    return AssetResponse(
        id=new_asset.id,
        organization_id=new_asset.organization_id,
        brand_id=new_asset.brand_id,
        title=new_asset.title,
        asset_type=new_asset.asset_type,
        campaign_name=new_asset.campaign_name,
        current_revision_id=new_asset.current_revision_id,
        status=new_asset.status,
        author_id=new_asset.author_id,
        author_name=current_user.full_name,
        created_at=new_asset.created_at,
        updated_at=new_asset.updated_at,
        latest_content=payload.content_text,
        latest_revision_number=1
    )

@router.post("/assets/{asset_id}/revisions", response_model=RevisionResponse)
async def create_revision(
    asset_id: str,
    payload: RevisionCreate,
    current_user: User = Depends(require_roles(UserRole.CONTENT_CREATOR, UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MarketingAsset)
        .where(
            MarketingAsset.id == asset_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(selectinload(MarketingAsset.revisions))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Marketing asset not found.")

    next_rev_num = len(asset.revisions) + 1 if asset.revisions else 1
    new_rev = AssetRevision(
        asset_id=asset.id,
        revision_number=next_rev_num,
        content_text=payload.content_text,
        change_summary=payload.change_summary or f"Revision {next_rev_num} saved by {current_user.full_name}",
        author_id=current_user.id
    )
    db.add(new_rev)
    await db.flush()

    # Reopening or editing approved content creates a new revision and requires re-review!
    asset.current_revision_id = new_rev.id
    asset.status = AssetStatus.DRAFT
    asset.updated_at = datetime.utcnow()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="ASSET_REVISION_CREATED",
        entity_type="AssetRevision",
        entity_id=new_rev.id,
        description=f"Revision {next_rev_num} created for '{asset.title}'. Status reset to DRAFT.",
        metadata_json={"revision_number": next_rev_num}
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
