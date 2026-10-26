from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models import User, Organization
from app.enums import UserRole
from app.security import verify_password, create_access_token, get_current_user
from app.schemas import UserResponse, TokenResponse, DemoRoleSwitchRequest

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated."
        )

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value, "org": user.organization_id})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/demo-users", response_model=List[UserResponse])
async def list_demo_users(db: AsyncSession = Depends(get_db)):
    """Returns available demonstration user accounts for role-switching."""
    result = await db.execute(select(User).order_by(User.role))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/switch-demo-role", response_model=TokenResponse)
async def switch_demo_role(req: DemoRoleSwitchRequest, db: AsyncSession = Depends(get_db)):
    """
    Clearly labeled local demo switcher.
    Instantly mints an authorized access token for the selected role without needing manual re-login.
    """
    result = await db.execute(select(User).where(User.role == req.role))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user found for role {req.role.value}")

    token = create_access_token(data={"sub": user.id, "role": user.role.value, "org": user.organization_id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
