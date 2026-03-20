import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..services.report_service import ReportService
from ..schemas.report import ReportResponse
from ..services.auth_service import get_current_user
from ..models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/generate", response_model=ReportResponse)
async def generate_report(
    db: AsyncSession = Depends(get_db),
    period: str = Query("monthly", enum=["daily", "weekly", "monthly", "termly", "yearly"]),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    term_id: Optional[uuid.UUID] = None,
    type: str = Query("all", enum=["all", "inflow", "outflow"]),
    current_user: User = Depends(get_current_user)
):
    return await ReportService.generate_report_data(
        db, period, date_from, date_to, term_id, type
    )

@router.get("/export/pdf")
async def export_report_pdf(
    db: AsyncSession = Depends(get_db),
    period: str = Query("monthly", enum=["daily", "weekly", "monthly", "termly", "yearly"]),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    term_id: Optional[uuid.UUID] = None,
    type: str = Query("all", enum=["all", "inflow", "outflow"]),
    current_user: User = Depends(get_current_user)
):
    report_data = await ReportService.generate_report_data(
        db, period, date_from, date_to, term_id, type
    )
    pdf_buffer = await ReportService.generate_pdf(report_data)
    
    filename = f"Financial_Report_{report_data.report_title.replace(' ', '_')}_{date.today().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
