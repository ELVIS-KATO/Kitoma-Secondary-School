from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..database import get_db
from ..models.user import User
from ..models.settings import SystemSetting
from ..schemas.settings import SchoolInfo, SystemPreferences, ChangePassword, TwoFactorToggle
from ..services.auth_service import get_current_user, get_current_active_admin
from ..utils.security import verify_password, get_password_hash
import json

router = APIRouter(prefix="/settings", tags=["settings"])

async def get_setting(db: AsyncSession, key: str, default_value: str = ""):
    result = await db.execute(select(SystemSetting).filter(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    return setting.value if setting else default_value

async def set_setting(db: AsyncSession, key: str, value: str, value_type: str = "string"):
    result = await db.execute(select(SystemSetting).filter(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
        setting.value_type = value_type
    else:
        setting = SystemSetting(key=key, value=value, value_type=value_type)
        db.add(setting)
    await db.commit()

@router.get("/school", response_model=SchoolInfo)
async def get_school_info(db: AsyncSession = Depends(get_db)):
    return {
        "name": await get_setting(db, "school_name", "Kitoma Secondary School"),
        "email": await get_setting(db, "school_email", "admin@kitoma.ac.ug"),
        "phone": await get_setting(db, "school_phone", "+256 700 000000"),
        "address": await get_setting(db, "school_address", "P.O. Box 123, Kitoma"),
        "logo_url": await get_setting(db, "school_logo", None)
    }

@router.post("/school")
async def update_school_info(
    data: SchoolInfo,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    await set_setting(db, "school_name", data.name)
    await set_setting(db, "school_email", data.email)
    await set_setting(db, "school_phone", data.phone)
    await set_setting(db, "school_address", data.address)
    if data.logo_url is not None:
        await set_setting(db, "school_logo", data.logo_url)
    return {"status": "success"}

@router.get("/preferences", response_model=SystemPreferences)
async def get_preferences(db: AsyncSession = Depends(get_db)):
    dark_mode = await get_setting(db, "dark_mode", "false")
    threshold = await get_setting(db, "outflow_threshold", "5000000.0")
    
    return {
        "dark_mode": dark_mode == "true",
        "receipt_prefix": await get_setting(db, "receipt_prefix", "KSS"),
        "outflow_threshold": float(threshold)
    }

@router.post("/preferences")
async def update_preferences(
    data: SystemPreferences,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    await set_setting(db, "dark_mode", str(data.dark_mode).lower(), "bool")
    await set_setting(db, "receipt_prefix", data.receipt_prefix)
    await set_setting(db, "outflow_threshold", str(data.outflow_threshold), "float")
    return {"status": "success"}

@router.post("/security/password")
async def change_password(
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"status": "success"}

@router.post("/security/2fa")
async def toggle_2fa(
    data: TwoFactorToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This is a stub for 2FA logic
    return {"status": "success", "enabled": data.enabled}
