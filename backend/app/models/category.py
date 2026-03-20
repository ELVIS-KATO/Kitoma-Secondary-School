import uuid
from datetime import datetime
from sqlalchemy import String, Enum, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import enum

class CategoryType(str, enum.Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"

class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="category")
