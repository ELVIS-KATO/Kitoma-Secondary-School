import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from ..database import get_db
from ..models.term import Term, TermNumber
from ..models.transaction import Transaction, TransactionType
from ..models.user import User
from ..schemas.term import Term as TermSchema, TermCreate, TermUpdate
from ..services.auth_service import get_current_user, get_current_active_accountant, get_current_active_admin

router = APIRouter(prefix="/terms", tags=["terms"])

@router.get("/", response_model=List[TermSchema])
async def list_terms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Term).order_by(Term.year.desc(), Term.term_number.desc())
    result = await db.execute(query)
    terms = result.scalars().all()
    
    # Calculate stats for each term
    for term in terms:
        inflows = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.term_id == term.id, Transaction.type == TransactionType.INFLOW
        )) or 0
        outflows = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.term_id == term.id, Transaction.type == TransactionType.OUTFLOW
        )) or 0
        term.total_inflows = float(inflows)
        term.total_outflows = float(outflows)
        term.net_balance = float(inflows - outflows)
        
    return terms

@router.post("/", response_model=TermSchema)
async def create_term(
    data: TermCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    # Check if exists
    result = await db.execute(select(Term).filter(
        Term.year == data.year, Term.term_number == data.term_number
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Term already exists for this year")
        
    term = Term(**data.model_dump())
    db.add(term)
    await db.commit()
    await db.refresh(term)
    return term

@router.delete("/{id}")
async def delete_term(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    term = await db.get(Term, id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    # Check if has transactions
    count = await db.scalar(select(func.count(Transaction.id)).filter(Transaction.term_id == id))
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete term that has transactions")
        
    await db.delete(term)
    await db.commit()
    return {"status": "success"}

@router.put("/{id}", response_model=TermSchema)
async def update_term(
    id: uuid.UUID,
    data: TermUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    term = await db.get(Term, id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(term, field, value)
        
    await db.commit()
    await db.refresh(term)
    return term

@router.patch("/{id}/activate", response_model=TermSchema)
async def activate_term(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    term = await db.get(Term, id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    # Deactivate all other terms
    await db.execute(update(Term).values(is_active=False))
    
    # Activate this one
    term.is_active = True
    
    await db.commit()
    await db.refresh(term)
    return term
