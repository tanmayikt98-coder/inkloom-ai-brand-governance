from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database import get_db
from app.models import (
    Brand, BrandFact, EvidenceSource, BrandRule, MarketingAsset, AssetRevision,
    ExtractedClaim, DependencyEdge, FactEvidenceLink, User
)
from app.enums import EntityType
from app.security import get_current_user
from app.schemas import ImpactGraphResponse, ImpactAnalysisResponse
from app.services.impact_engine import ImpactEngine

router = APIRouter(tags=["Brand Impact Map"])

@router.get("/brands/{brand_id}/impact-graph", response_model=ImpactGraphResponse)
async def get_brand_impact_graph(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    # 1. Facts with evidence links
    facts_res = await db.execute(
        select(BrandFact)
        .where(BrandFact.brand_id == brand_id)
        .options(selectinload(BrandFact.evidence_links))
    )
    facts = facts_res.scalars().all()

    # 2. Evidence sources
    ev_res = await db.execute(
        select(EvidenceSource).where(EvidenceSource.brand_id == brand_id)
    )
    evidence = ev_res.scalars().all()

    # 3. Rules
    rules_res = await db.execute(
        select(BrandRule).where(BrandRule.brand_id == brand_id)
    )
    rules = rules_res.scalars().all()

    # 4. Assets with revisions and claims
    assets_res = await db.execute(
        select(MarketingAsset)
        .where(MarketingAsset.brand_id == brand_id)
        .options(selectinload(MarketingAsset.revisions).selectinload(AssetRevision.claims))
    )
    assets = assets_res.scalars().all()

    # 5. Stored dependency edges
    deps_res = await db.execute(
        select(DependencyEdge).where(DependencyEdge.brand_id == brand_id)
    )
    deps = deps_res.scalars().all()

    return ImpactEngine.build_graph(facts, evidence, rules, assets, deps)

@router.get("/impact/analyze", response_model=ImpactAnalysisResponse)
async def analyze_entity_impact(
    entity_id: str = Query(..., description="ID of Fact, Evidence, or Rule"),
    entity_type: EntityType = Query(..., description="Type: FACT, EVIDENCE, or RULE"),
    brand_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch facts
    facts_res = await db.execute(
        select(BrandFact).options(selectinload(BrandFact.evidence_links))
    )
    facts = facts_res.scalars().all()

    # Fetch rules
    rules_res = await db.execute(select(BrandRule))
    rules = rules_res.scalars().all()

    # Fetch assets
    assets_res = await db.execute(
        select(MarketingAsset)
        .where(MarketingAsset.organization_id == current_user.organization_id)
        .options(selectinload(MarketingAsset.revisions).selectinload(AssetRevision.claims))
    )
    assets = assets_res.scalars().all()

    return ImpactEngine.analyze_impact(entity_id, entity_type, facts, assets, rules)
