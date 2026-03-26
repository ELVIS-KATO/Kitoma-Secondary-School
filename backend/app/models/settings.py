from sqlalchemy import String, Boolean, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value_type: Mapped[str] = mapped_column(String(20)) # string, bool, float, int
    value: Mapped[str] = mapped_column(Text)
