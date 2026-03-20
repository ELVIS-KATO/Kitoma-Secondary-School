import uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, Enum, Date, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import enum

class TermNumber(int, enum.Enum):
    TERM_1 = 1
    TERM_2 = 2
    TERM_3 = 3

class Term(Base):
    __tablename__ = "terms"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50))
    year: Mapped[int] = mapped_column(Integer)
    term_number: Mapped[TermNumber] = mapped_column(Enum(TermNumber))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="term")
