from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from .transaction import Transaction

class ReportSummary(BaseModel):
    total_inflows: Decimal
    total_outflows: Decimal
    net_position: Decimal
    transaction_count: int

class CategoryBreakdown(BaseModel):
    category_id: str
    category_name: str
    total_amount: Decimal
    percentage: float

class ReportResponse(BaseModel):
    summary: ReportSummary
    transactions: list[Transaction]
    category_breakdown: list[CategoryBreakdown]
    opening_balance: Decimal
    closing_balance: Decimal
    generated_at: datetime
    report_title: str
    period: str

class CashFlowPoint(BaseModel):
    month: str
    inflows: Decimal
    outflows: Decimal

class DashboardSummary(BaseModel):
    total_inflows_today: Decimal
    total_outflows_today: Decimal
    total_inflows_month: Decimal
    total_outflows_month: Decimal
    total_inflows_term: Decimal
    total_outflows_term: Decimal
    total_inflows_year: Decimal
    total_outflows_year: Decimal
    net_balance: Decimal
    recent_transactions: list[Transaction]
    monthly_cashflow: list[CashFlowPoint]
    top_inflow_categories: list[CategoryBreakdown]
    top_outflow_categories: list[CategoryBreakdown]
