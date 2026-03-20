import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from ..database import get_db
from ..models.transaction import Transaction, TransactionType, PaymentMethod
from ..models.category import Category
from ..models.term import Term
from ..models.user import User, UserRole
from ..models.audit_log import AuditLog
from ..schemas.transaction import Transaction as TransactionSchema, TransactionCreate, TransactionUpdate, PaginatedTransactions
from ..services.auth_service import get_current_user, get_current_active_accountant, get_current_active_admin
from ..services.receipt_service import ReceiptService
from ..utils.pagination import paginate

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/", response_model=PaginatedTransactions)
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    type: Optional[TransactionType] = None,
    category_id: Optional[uuid.UUID] = None,
    term_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    payment_method: Optional[PaymentMethod] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction).filter(Transaction.is_deleted == False)
    
    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if term_id:
        query = query.filter(Transaction.term_id == term_id)
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)
    if payment_method:
        query = query.filter(Transaction.payment_method == payment_method)
    if search:
        query = query.filter(
            or_(
                Transaction.payer_name.ilike(f"%{search}%"),
                Transaction.description.ilike(f"%{search}%"),
                Transaction.reference_number.ilike(f"%{search}%")
            )
        )
        
    query = query.order_by(desc(Transaction.transaction_date), desc(Transaction.created_at))
    
    return await paginate(db, query, page, size)

@router.post("/", response_model=TransactionSchema)
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    # Auto-generate reference number
    ref_num = f"REF-{uuid.uuid4().hex[:8].upper()}"
    
    transaction = Transaction(
        **data.model_dump(),
        reference_number=ref_num,
        recorded_by=current_user.id
    )
    
    db.add(transaction)
    await db.flush()
    
    # Auto-generate receipt for inflows
    if transaction.type == TransactionType.INFLOW:
        receipt = await ReceiptService.create_receipt(db, transaction, current_user.id)
        transaction.receipt_issued = True
        
    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id,
        metadata={"amount": float(transaction.amount), "type": transaction.type.value}
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.get("/{id}", response_model=TransactionSchema)
async def get_transaction(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Transaction).filter(Transaction.id == id, Transaction.is_deleted == False))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{id}", response_model=TransactionSchema)
async def update_transaction(
    id: uuid.UUID,
    data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    result = await db.execute(select(Transaction).filter(Transaction.id == id, Transaction.is_deleted == False))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
        
    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id,
        metadata=update_data
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.delete("/{id}")
async def delete_transaction(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    result = await db.execute(select(Transaction).filter(Transaction.id == id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    transaction.is_deleted = True # Soft delete
    
    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_TRANSACTION",
        entity_type="transaction",
        entity_id=transaction.id
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success"}
