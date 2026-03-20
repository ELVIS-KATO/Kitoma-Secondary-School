import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

class Receipt(Base):
    __tablename__ = "receipts"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id"), unique=True)
    issued_to: Mapped[str] = mapped_column(String(150))
    issued_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    printed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="receipt")
    issued_by_user: Mapped["User"] = relationship("User", back_populates="receipts_issued")
