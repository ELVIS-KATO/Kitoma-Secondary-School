from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    SCHOOL_NAME: str = "Kitoma Secondary School"
    SCHOOL_ADDRESS: str = "P.O. Box 123, Kitoma"
    SCHOOL_PHONE: str = "+256 700 000000"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
