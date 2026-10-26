import hashlib
import hmac
import json
import base64
import time
from typing import Optional, List
from fastapi import HTTPException, status, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.database import get_db
from app.models import User, Organization
from app.enums import UserRole

def hash_password(password: str) -> str:
    salt = settings.SECRET_KEY[:16].encode("utf-8")
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pwd_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

def create_access_token(data: dict, expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60) -> str:
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{encoded}.{sig}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        encoded, sig = parts
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(encoded.encode("utf-8")).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_role: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Resolves the current authenticated user.
    Supports standard Bearer tokens AND demo-role switching when DEMO_MODE is active.
    """
    user: Optional[User] = None

    # 1. Bearer Token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            result = await db.execute(select(User).where(User.id == payload["sub"]))
            user = result.scalars().first()

    # 2. Demo-mode Header (Clearly labelled for local demonstration)
    if not user and settings.DEMO_MODE and x_demo_role:
        try:
            role_enum = UserRole(x_demo_role)
            result = await db.execute(select(User).where(User.role == role_enum))
            user = result.scalars().first()
        except ValueError:
            pass

    # 3. Fallback demo user if still none and in demo mode
    if not user and settings.DEMO_MODE:
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or have expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account."
        )

    return user

def require_roles(*allowed_roles: UserRole):
    """
    Role-Based Access Control dependency factory.
    Enforces authorization on backend endpoints.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # ORGANIZATION_ADMIN has superuser access within their tenant workspace
        if current_user.role == UserRole.ORGANIZATION_ADMIN:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{current_user.role.value}' lacks required permissions for this action. Allowed roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
