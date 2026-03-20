import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Enum, Text, DECIMAL, ForeignKey, Date, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import enum

class TransactionType(str, enum.Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    CHEQUE = "cheque"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType))
    amount: Mapped[Decimal] = mapped_column(DECIMAL(12, 2))
    description: Mapped[str] = mapped_column(Text)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    term_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("terms.id"), nullable=True)
    payer_name: Mapped[str] = mapped_column(String(150), nullable=True) # or "Paid To" for outflows
    reference_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod))
    transaction_date: Mapped[date] = mapped_column(Date, default=date.today)
    recorded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    receipt_issued: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="transactions")
    term: Mapped["Term"] = relationship("Term", back_populates="transactions")
    recorded_by_user: Mapped["User"] = relationship("User", back_populates="transactions_recorded")
    receipt: Mapped["Receipt"] = relationship("Receipt", back_populates="transaction", uselist=False)
