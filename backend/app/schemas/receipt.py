import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ReceiptBase(BaseModel):
    receipt_number: str
    transaction_id: uuid.UUID
    issued_to: str
    issued_by: uuid.UUID
    issued_at: datetime
    printed_at: datetime | None = None

class Receipt(ReceiptBase):
    id: uuid.UUID
    issued_by_name: str | None = None
    transaction_amount: float | None = None
    transaction_date: str | None = None
    payment_method: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedReceipts(BaseModel):
    items: list[Receipt]
    total: int
    page: int
    pages: int
