import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models.category import Category, CategoryType
from ..models.transaction import Transaction
from ..models.user import User
from ..schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate
from ..services.auth_service import get_current_user, get_current_active_accountant, get_current_active_admin

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategorySchema])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Category).order_by(Category.name)
    result = await db.execute(query)
    categories = result.scalars().all()
    
    # Calculate stats for each category
    for cat in categories:
        count = await db.scalar(select(func.count(Transaction.id)).filter(Transaction.category_id == cat.id))
        total = await db.scalar(select(func.sum(Transaction.amount)).filter(Transaction.category_id == cat.id)) or 0
        cat.transaction_count = count
        cat.total_amount = float(total)
        
    return categories

@router.post("/", response_model=CategorySchema)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    # Check if exists
    result = await db.execute(select(Category).filter(Category.name == data.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category already exists")
        
    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/{id}", response_model=CategorySchema)
async def update_category(
    id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    category = await db.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
        
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{id}")
async def delete_category(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    category = await db.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check if has transactions
    count = await db.scalar(select(func.count(Transaction.id)).filter(Transaction.category_id == id))
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category that has transactions")
        
    await db.delete(category)
    await db.commit()
    return {"status": "success"}
