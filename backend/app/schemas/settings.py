from pydantic import BaseModel
from typing import Optional

class SchoolInfo(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    logo_url: Optional[str] = None

class SystemPreferences(BaseModel):
    dark_mode: bool = False
    receipt_prefix: str = "KSS"
    outflow_threshold: float = 5000000.0

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class TwoFactorToggle(BaseModel):
    enabled: bool
