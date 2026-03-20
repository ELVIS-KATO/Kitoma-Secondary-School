from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.user import User
from ..schemas.user import Token, User as UserSchema, UserCreate
from ..utils.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from ..services.auth_service import get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(
        subject=user.id, role=user.role.value
    )
    refresh_token = create_refresh_token(
        subject=user.id, role=user.role.value
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # In a real app, verify the refresh token against the database/whitelist
    # Simplified here
    try:
        from jose import jwt
        from ..utils.security import ALGORITHM
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id = payload.get("sub")
        role = payload.get("role")
        
        new_access = create_access_token(subject=user_id, role=role)
        new_refresh = create_refresh_token(subject=user_id, role=role)
        
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
