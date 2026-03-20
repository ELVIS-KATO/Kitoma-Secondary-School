import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import User as UserSchema, UserCreate, UserUpdate
from ..utils.security import get_password_hash
from ..services.auth_service import get_current_user, get_current_active_admin

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserSchema])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    query = select(User).order_by(User.name)
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.post("/", response_model=UserSchema)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    # Check if exists
    result = await db.execute(select(User).filter(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists with this email")
        
    user = User(
        name=data.name,
        email=data.email,
        role=data.role,
        password_hash=get_password_hash(data.password),
        is_active=data.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{id}", response_model=UserSchema)
async def update_user(
    id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    user = await db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        update_data["password_hash"] = get_password_hash(password)
        
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.patch("/{id}/toggle-active", response_model=UserSchema)
async def toggle_user_active(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    user = await db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user
