from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import (
    Brand, BrandFact, EvidenceSource, BrandRule, MarketingAsset, AssetRevision,
    ExtractedClaim, WhatIfScenario, ScenarioResult, User, AuditEvent, FactEvidenceLink
)
from app.enums import (
    UserRole, ScenarioChangeType, ScenarioStatus, FactStatus, EvidenceStatus, RuleType, Severity
)
from app.security import get_current_user, require_roles
from app.schemas import (
    WhatIfScenarioCreate, WhatIfScenarioResponse, ScenarioSimulationResponse
)
from app.services.simulator_engine import SimulatorEngine

router = APIRouter(tags=["What-If Brand Simulator"])

@router.get("/brands/{brand_id}/scenarios", response_model=List[WhatIfScenarioResponse])
async def list_scenarios(
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
        select(WhatIfScenario)
        .where(WhatIfScenario.brand_id == brand_id)
        .options(selectinload(WhatIfScenario.results))
        .order_by(WhatIfScenario.created_at.desc())
    )
    scenarios = result.scalars().all()

    resp_items = []
    for s in scenarios:
        latest_res = s.results[-1] if s.results else None
        res_dict = None
        if latest_res:
            res_dict = {
                "baseline_non_compliant_count": latest_res.baseline_non_compliant_count,
                "projected_non_compliant_count": latest_res.projected_non_compliant_count,
                "affected_assets_count": latest_res.affected_assets_count,
                "summary_narrative": latest_res.summary_narrative
            }

        resp_items.append(WhatIfScenarioResponse(
            id=s.id,
            brand_id=s.brand_id,
            title=s.title,
            description=s.description,
            change_type=s.change_type,
            target_entity_id=s.target_entity_id,
            proposed_payload_json=s.proposed_payload_json,
            status=s.status,
            created_at=s.created_at,
            latest_result=res_dict
        ))

    return resp_items

@router.post("/brands/{brand_id}/scenarios", response_model=WhatIfScenarioResponse)
async def create_scenario(
    brand_id: str,
    payload: WhatIfScenarioCreate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.CAMPAIGN_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    scenario = WhatIfScenario(
        brand_id=brand_id,
        created_by_user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        change_type=payload.change_type,
        target_entity_id=payload.target_entity_id,
        proposed_payload_json=payload.proposed_payload,
        status=ScenarioStatus.DRAFT
    )
    db.add(scenario)
    await db.flush()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="SCENARIO_CREATED",
        entity_type="WhatIfScenario",
        entity_id=scenario.id,
        description=f"Simulation scenario '{scenario.title}' drafted by {current_user.full_name}",
        metadata_json={"change_type": scenario.change_type.value}
    )
    db.add(event)
    await db.commit()

    return WhatIfScenarioResponse(
        id=scenario.id,
        brand_id=scenario.brand_id,
        title=scenario.title,
        description=scenario.description,
        change_type=scenario.change_type,
        target_entity_id=scenario.target_entity_id,
        proposed_payload_json=scenario.proposed_payload_json,
        status=scenario.status,
        created_at=scenario.created_at,
        latest_result=None
    )

@router.post("/scenarios/{scenario_id}/run", response_model=ScenarioSimulationResponse)
async def run_scenario_simulation(
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    scen_res = await db.execute(
        select(WhatIfScenario).where(WhatIfScenario.id == scenario_id)
    )
    scenario = scen_res.scalars().first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    brand_id = scenario.brand_id

    # Fetch production facts, evidence, rules, assets
    facts_res = await db.execute(
        select(BrandFact)
        .where(BrandFact.brand_id == brand_id)
        .options(selectinload(BrandFact.evidence_links).selectinload(FactEvidenceLink.evidence))
    )
    prod_facts = facts_res.scalars().all()

    ev_res = await db.execute(select(EvidenceSource).where(EvidenceSource.brand_id == brand_id))
    prod_evidence = ev_res.scalars().all()

    rules_res = await db.execute(select(BrandRule).where(BrandRule.brand_id == brand_id))
    prod_rules = rules_res.scalars().all()

    assets_res = await db.execute(
        select(MarketingAsset)
        .where(MarketingAsset.brand_id == brand_id)
        .options(selectinload(MarketingAsset.revisions).selectinload(AssetRevision.claims))
    )
    prod_assets = assets_res.scalars().all()

    # Run in isolated simulation engine
    sim_result = SimulatorEngine.simulate_scenario(
        scenario_id=scenario.id,
        change_type=scenario.change_type,
        target_entity_id=scenario.target_entity_id,
        proposed_payload=scenario.proposed_payload_json,
        production_facts=prod_facts,
        production_evidence=prod_evidence,
        production_rules=prod_rules,
        production_assets=prod_assets
    )

    # Persist simulation result record
    db_result = ScenarioResult(
        scenario_id=scenario.id,
        baseline_non_compliant_count=sim_result.baseline_non_compliant_assets,
        projected_non_compliant_count=sim_result.projected_non_compliant_assets,
        affected_assets_count=sim_result.affected_assets_count,
        projected_findings_json=sim_result.simulated_findings,
        summary_narrative=sim_result.risk_summary
    )
    db.add(db_result)
    scenario.status = ScenarioStatus.SIMULATED
    await db.commit()

    return sim_result

@router.post("/scenarios/{scenario_id}/promote", response_model=WhatIfScenarioResponse)
async def promote_scenario_to_production(
    scenario_id: str,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Promotes an approved simulation scenario into genuine production changes.
    Enforces audit logging, version increments, and traceability.
    """
    scen_res = await db.execute(
        select(WhatIfScenario).where(WhatIfScenario.id == scenario_id)
    )
    scenario = scen_res.scalars().first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    if scenario.status != ScenarioStatus.SIMULATED:
        raise HTTPException(status_code=400, detail="Only simulated scenarios can be promoted to production.")

    brand_id = scenario.brand_id
    change_type = scenario.change_type
    target_id = scenario.target_entity_id
    payload = scenario.proposed_payload_json

    # 1. Apply promotion according to change type
    if change_type == ScenarioChangeType.UPDATE_FACT_METRIC:
        fact_res = await db.execute(select(BrandFact).where(BrandFact.id == target_id))
        fact = fact_res.scalars().first()
        if fact:
            old_metric = fact.metric_value
            new_metric = float(payload.get("metric_value", old_metric))
            fact.metric_value = new_metric
            fact.version += 1
            fact.updated_at = datetime.utcnow()
            fact.notes = (fact.notes or "") + f" [Promoted from scenario '{scenario.title}' by {current_user.full_name}]"

    elif change_type == ScenarioChangeType.EXPIRE_EVIDENCE:
        ev_res = await db.execute(select(EvidenceSource).where(EvidenceSource.id == target_id))
        ev = ev_res.scalars().first()
        if ev:
            ev.verification_status = EvidenceStatus.EXPIRED
            ev.expiration_date = datetime.utcnow()
            ev.verification_notes = (ev.verification_notes or "") + f" [Expired via promoted scenario '{scenario.title}']"

    elif change_type == ScenarioChangeType.ADD_RESTRICTED_PHRASE:
        phrase = payload.get("restricted_phrase", "")
        new_rule = BrandRule(
            brand_id=brand_id,
            rule_code=f"RULE-RESTRICT-{datetime.utcnow().strftime('%H%M')}",
            name=f"Prohibited Phrase: {phrase}",
            rule_type=RuleType.FORBIDDEN_KEYWORD,
            check_pattern=phrase,
            failure_message=f"Usage of '{phrase}' is restricted under promoted brand policy.",
            severity=Severity.HIGH,
            is_active=True
        )
        db.add(new_rule)

    elif change_type == ScenarioChangeType.ADD_MANDATORY_DISCLAIMER:
        disclaimer = payload.get("disclaimer_text", "")
        new_rule = BrandRule(
            brand_id=brand_id,
            rule_code=f"RULE-DISCLAIM-{datetime.utcnow().strftime('%H%M')}",
            name=f"Mandatory Disclosure: {disclaimer[:30]}",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern=disclaimer,
            failure_message=f"All public collateral must contain '{disclaimer}'.",
            severity=Severity.HIGH,
            is_active=True
        )
        db.add(new_rule)

    elif change_type == ScenarioChangeType.RETIRE_FACT:
        fact_res = await db.execute(select(BrandFact).where(BrandFact.id == target_id))
        fact = fact_res.scalars().first()
        if fact:
            fact.status = FactStatus.SUPERSEDED
            fact.version += 1
            fact.updated_at = datetime.utcnow()

    # Mark scenario as PROMOTED
    scenario.status = ScenarioStatus.PROMOTED

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="SCENARIO_PROMOTED_TO_PRODUCTION",
        entity_type="WhatIfScenario",
        entity_id=scenario.id,
        description=f"What-If scenario '{scenario.title}' formally promoted to live production by {current_user.full_name}",
        metadata_json={"change_type": change_type.value, "promoted_at": datetime.utcnow().isoformat()}
    )
    db.add(event)
    await db.commit()

    return WhatIfScenarioResponse(
        id=scenario.id,
        brand_id=scenario.brand_id,
        title=scenario.title,
        description=scenario.description,
        change_type=scenario.change_type,
        target_entity_id=scenario.target_entity_id,
        proposed_payload_json=scenario.proposed_payload_json,
        status=scenario.status,
        created_at=scenario.created_at,
        latest_result=None
    )
