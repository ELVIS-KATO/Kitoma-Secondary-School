import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from ..models.term import TermNumber

class TermBase(BaseModel):
    name: str
    year: int
    term_number: TermNumber
    start_date: date
    end_date: date
    is_active: bool = False

class TermCreate(TermBase):
    pass

class TermUpdate(BaseModel):
    name: str | None = None
    year: int | None = None
    term_number: TermNumber | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None

class Term(TermBase):
    id: uuid.UUID
    created_at: datetime
    total_inflows: float = 0.0
    total_outflows: float = 0.0
    net_balance: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)
