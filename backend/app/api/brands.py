from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import Brand, User
from app.enums import UserRole
from app.security import get_current_user, require_roles
from app.schemas import BrandResponse, BrandCreate

router = APIRouter(prefix="/brands", tags=["Brands & Workspaces"])

@router.get("", response_model=List[BrandResponse])
async def list_brands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Workspace isolation: filter by organization_id
    result = await db.execute(
        select(Brand).where(Brand.organization_id == current_user.organization_id)
    )
    return [BrandResponse.model_validate(b) for b in result.scalars().all()]

@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Brand).where(
            Brand.id == brand_id,
            Brand.organization_id == current_user.organization_id
        )
    )
    brand = result.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand workspace not found.")
    return BrandResponse.model_validate(brand)

@router.post("", response_model=BrandResponse)
async def create_brand(
    payload: BrandCreate,
    current_user: User = Depends(require_roles(UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    new_brand = Brand(
        organization_id=current_user.organization_id,
        name=payload.name,
        tagline=payload.tagline,
        description=payload.description
    )
    db.add(new_brand)
    await db.commit()
    await db.refresh(new_brand)
    return BrandResponse.model_validate(new_brand)
