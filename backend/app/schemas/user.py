import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from ..models.user import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = None

class User(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None
    role: str | None = None
