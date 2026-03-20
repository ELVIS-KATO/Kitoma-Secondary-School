import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from ..models.category import CategoryType

class CategoryBase(BaseModel):
    name: str
    type: CategoryType
    description: str | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = None
    type: CategoryType | None = None
    description: str | None = None

class Category(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    transaction_count: int = 0
    total_amount: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)
