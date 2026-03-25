import uuid
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from ..database import get_db
from ..models.receipt import Receipt
from ..models.transaction import Transaction
from ..models.audit_log import AuditLog
from ..models.user import User
from ..schemas.receipt import Receipt as ReceiptSchema, PaginatedReceipts
from ..services.auth_service import get_current_user, get_current_active_accountant
from ..services.receipt_service import ReceiptService
from ..utils.pagination import paginate

router = APIRouter(prefix="/receipts", tags=["receipts"])

@router.get("/", response_model=PaginatedReceipts)
async def list_receipts(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user)
):
    query = select(Receipt).join(Transaction)
    
    if search:
        query = query.filter(
            or_(
                Receipt.receipt_number.ilike(f"%{search}%"),
                Receipt.issued_to.ilike(f"%{search}%")
            )
        )
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)
        
    query = query.order_by(desc(Receipt.issued_at))
    
    return await paginate(db, query, page, size)

@router.get("/{id}", response_model=ReceiptSchema)
async def get_receipt(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Receipt).filter(Receipt.id == id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.post("/{id}/reprint")
async def reprint_receipt(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_accountant)
):
    result = await db.execute(select(Receipt).filter(Receipt.id == id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    receipt.printed_at = datetime.utcnow()
    
    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="PRINT_RECEIPT",
        entity_type="receipt",
        entity_id=receipt.id,
        details=jsonable_encoder({"receipt_number": receipt.receipt_number})
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success"}

@router.get("/{id}/pdf")
async def get_receipt_pdf(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Receipt).filter(Receipt.id == id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    pdf_buffer = await ReceiptService.generate_pdf(receipt, db)
    
    filename = f"Receipt_{receipt.receipt_number}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.get("/transaction/{transaction_id}/pdf")
async def get_receipt_pdf_by_transaction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Receipt).filter(Receipt.transaction_id == transaction_id))
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found for this transaction")
        
    pdf_buffer = await ReceiptService.generate_pdf(receipt, db)
    filename = f"Receipt_{receipt.receipt_number}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

