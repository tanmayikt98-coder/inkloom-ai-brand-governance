from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import Brand, BrandRule, User, AuditEvent
from app.enums import UserRole
from app.security import get_current_user, require_roles
from app.schemas import BrandRuleResponse, BrandRuleCreate

router = APIRouter(tags=["Brand Rules & Policies"])

@router.get("/brands/{brand_id}/rules", response_model=List[BrandRuleResponse])
async def list_brand_rules(
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
        select(BrandRule)
        .where(BrandRule.brand_id == brand_id)
        .order_by(BrandRule.rule_code)
    )
    return [BrandRuleResponse.model_validate(r) for r in result.scalars().all()]

@router.post("/brands/{brand_id}/rules", response_model=BrandRuleResponse)
async def create_brand_rule(
    brand_id: str,
    payload: BrandRuleCreate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    new_rule = BrandRule(
        brand_id=brand_id,
        rule_code=payload.rule_code,
        name=payload.name,
        rule_type=payload.rule_type,
        check_pattern=payload.check_pattern,
        failure_message=payload.failure_message,
        severity=payload.severity,
        is_active=payload.is_active
    )
    db.add(new_rule)
    await db.flush()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="RULE_CREATED",
        entity_type="BrandRule",
        entity_id=new_rule.id,
        description=f"Rule '{new_rule.rule_code}' ({new_rule.name}) established by {current_user.full_name}",
        metadata_json={"severity": new_rule.severity.value, "rule_type": new_rule.rule_type.value}
    )
    db.add(event)
    await db.commit()

    return BrandRuleResponse.model_validate(new_rule)

@router.put("/rules/{rule_id}", response_model=BrandRuleResponse)
async def update_brand_rule(
    rule_id: str,
    payload: BrandRuleCreate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandRule)
        .join(Brand, BrandRule.brand_id == Brand.id)
        .where(BrandRule.id == rule_id, Brand.organization_id == current_user.organization_id)
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Brand rule not found.")

    rule.name = payload.name
    rule.rule_type = payload.rule_type
    rule.check_pattern = payload.check_pattern
    rule.failure_message = payload.failure_message
    rule.severity = payload.severity
    rule.is_active = payload.is_active

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="RULE_UPDATED",
        entity_type="BrandRule",
        entity_id=rule.id,
        description=f"Rule '{rule.rule_code}' updated by {current_user.full_name}",
        metadata_json={"is_active": rule.is_active, "severity": rule.severity.value}
    )
    db.add(event)
    await db.commit()

    return BrandRuleResponse.model_validate(rule)
