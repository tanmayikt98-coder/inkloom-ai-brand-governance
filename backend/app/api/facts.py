from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Brand, BrandFact, EvidenceSource, FactEvidenceLink, User, AuditEvent, MarketingAsset, AssetRevision, ExtractedClaim
from app.enums import UserRole, FactStatus
from app.security import get_current_user, require_roles
from app.schemas import BrandFactResponse, BrandFactCreate, BrandFactUpdate, EvidenceSourceResponse

router = APIRouter(tags=["Brand Facts"])

@router.get("/brands/{brand_id}/facts", response_model=List[BrandFactResponse])
async def list_brand_facts(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify brand belongs to user organization
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    result = await db.execute(
        select(BrandFact)
        .where(BrandFact.brand_id == brand_id)
        .options(
            selectinload(BrandFact.evidence_links).selectinload(FactEvidenceLink.evidence)
        )
        .order_by(BrandFact.created_at.desc())
    )
    facts = result.scalars().all()

    # Calculate dependent asset count for each fact
    response_items = []
    for f in facts:
        # Count distinct assets with claims matching this fact
        count_res = await db.execute(
            select(func.count(func.distinct(MarketingAsset.id)))
            .join(AssetRevision, MarketingAsset.id == AssetRevision.asset_id)
            .join(ExtractedClaim, AssetRevision.id == ExtractedClaim.revision_id)
            .where(ExtractedClaim.matched_fact_id == f.id)
        )
        dep_count = count_res.scalar() or 0

        ev_sources = [
            EvidenceSourceResponse.model_validate(link.evidence)
            for link in f.evidence_links if link.evidence
        ]

        resp = BrandFactResponse(
            id=f.id,
            brand_id=f.brand_id,
            claim_statement=f.claim_statement,
            category=f.category,
            status=f.status,
            metric_value=f.metric_value,
            metric_unit=f.metric_unit,
            validity_start=f.validity_start,
            validity_end=f.validity_end,
            version=f.version,
            responsible_owner=f.responsible_owner,
            notes=f.notes,
            created_at=f.created_at,
            updated_at=f.updated_at,
            evidence_sources=ev_sources,
            dependent_asset_count=dep_count
        )
        response_items.append(resp)

    return response_items

@router.post("/brands/{brand_id}/facts", response_model=BrandFactResponse)
async def create_brand_fact(
    brand_id: str,
    payload: BrandFactCreate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Verify brand
    b_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not b_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    new_fact = BrandFact(
        brand_id=brand_id,
        claim_statement=payload.claim_statement,
        category=payload.category,
        status=payload.status,
        metric_value=payload.metric_value,
        metric_unit=payload.metric_unit,
        validity_start=payload.validity_start or datetime.utcnow(),
        validity_end=payload.validity_end,
        version=1,
        responsible_owner=payload.responsible_owner or current_user.full_name,
        notes=payload.notes
    )
    db.add(new_fact)
    await db.flush()

    # Link evidence sources if provided
    ev_sources = []
    if payload.evidence_ids:
        for eid in payload.evidence_ids:
            ev_res = await db.execute(select(EvidenceSource).where(EvidenceSource.id == eid))
            ev = ev_res.scalars().first()
            if ev:
                link = FactEvidenceLink(fact_id=new_fact.id, evidence_id=ev.id, exact_passage=ev.document_text[:100])
                db.add(link)
                ev_sources.append(EvidenceSourceResponse.model_validate(ev))

    # Audit event
    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="FACT_CREATED",
        entity_type="BrandFact",
        entity_id=new_fact.id,
        description=f"Fact '{new_fact.claim_statement}' created by {current_user.full_name}",
        metadata_json={"metric": new_fact.metric_value, "status": new_fact.status.value}
    )
    db.add(event)
    await db.commit()

    return BrandFactResponse(
        id=new_fact.id,
        brand_id=new_fact.brand_id,
        claim_statement=new_fact.claim_statement,
        category=new_fact.category,
        status=new_fact.status,
        metric_value=new_fact.metric_value,
        metric_unit=new_fact.metric_unit,
        validity_start=new_fact.validity_start,
        validity_end=new_fact.validity_end,
        version=new_fact.version,
        responsible_owner=new_fact.responsible_owner,
        notes=new_fact.notes,
        created_at=new_fact.created_at,
        updated_at=new_fact.updated_at,
        evidence_sources=ev_sources,
        dependent_asset_count=0
    )

@router.put("/facts/{fact_id}", response_model=BrandFactResponse)
async def update_brand_fact(
    fact_id: str,
    payload: BrandFactUpdate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandFact)
        .join(Brand, BrandFact.brand_id == Brand.id)
        .where(BrandFact.id == fact_id, Brand.organization_id == current_user.organization_id)
        .options(selectinload(BrandFact.evidence_links).selectinload(FactEvidenceLink.evidence))
    )
    fact = result.scalars().first()
    if not fact:
        raise HTTPException(status_code=404, detail="Brand fact not found.")

    version_changed = False
    if payload.claim_statement is not None and payload.claim_statement != fact.claim_statement:
        fact.claim_statement = payload.claim_statement
        version_changed = True
    if payload.metric_value is not None and payload.metric_value != fact.metric_value:
        fact.metric_value = payload.metric_value
        version_changed = True
    if payload.category is not None:
        fact.category = payload.category
    if payload.status is not None:
        fact.status = payload.status
    if payload.metric_unit is not None:
        fact.metric_unit = payload.metric_unit
    if payload.validity_end is not None:
        fact.validity_end = payload.validity_end
    if payload.responsible_owner is not None:
        fact.responsible_owner = payload.responsible_owner
    if payload.notes is not None:
        fact.notes = payload.notes

    if version_changed:
        fact.version += 1

    fact.updated_at = datetime.utcnow()

    # Log audit event
    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="FACT_UPDATED",
        entity_type="BrandFact",
        entity_id=fact.id,
        description=f"Fact updated to v{fact.version} by {current_user.full_name}",
        metadata_json={"version": fact.version, "status": fact.status.value, "metric": fact.metric_value}
    )
    db.add(event)
    await db.commit()

    ev_sources = [
        EvidenceSourceResponse.model_validate(link.evidence)
        for link in fact.evidence_links if link.evidence
    ]

    return BrandFactResponse(
        id=fact.id,
        brand_id=fact.brand_id,
        claim_statement=fact.claim_statement,
        category=fact.category,
        status=fact.status,
        metric_value=fact.metric_value,
        metric_unit=fact.metric_unit,
        validity_start=fact.validity_start,
        validity_end=fact.validity_end,
        version=fact.version,
        responsible_owner=fact.responsible_owner,
        notes=fact.notes,
        created_at=fact.created_at,
        updated_at=fact.updated_at,
        evidence_sources=ev_sources,
        dependent_asset_count=0
    )
