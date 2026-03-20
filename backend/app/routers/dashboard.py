from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..services.report_service import ReportService
from ..schemas.report import DashboardSummary
from ..services.auth_service import get_current_user
from ..models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await ReportService.get_dashboard_summary(db)
