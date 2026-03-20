import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from ..models.transaction import TransactionType, PaymentMethod

class TransactionBase(BaseModel):
    type: TransactionType
    amount: Decimal = Field(gt=0)
    description: str
    category_id: uuid.UUID
    term_id: uuid.UUID | None = None
    payer_name: str | None = None
    payment_method: PaymentMethod
    transaction_date: date = Field(default_factory=date.today)
    notes: str | None = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: TransactionType | None = None
    amount: Decimal | None = Field(None, gt=0)
    description: str | None = None
    category_id: uuid.UUID | None = None
    term_id: uuid.UUID | None = None
    payer_name: str | None = None
    payment_method: PaymentMethod | None = None
    transaction_date: date | None = None
    notes: str | None = None

class Transaction(TransactionBase):
    id: uuid.UUID
    reference_number: str
    recorded_by: uuid.UUID
    receipt_issued: bool
    created_at: datetime
    updated_at: datetime
    
    # Nested fields for easy frontend access
    category_name: str | None = None
    term_name: str | None = None
    recorded_by_name: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedTransactions(BaseModel):
    items: list[Transaction]
    total: int
    page: int
    pages: int
