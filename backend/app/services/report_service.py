from datetime import date, datetime, timedelta
from decimal import Decimal
from io import BytesIO
from typing import List, Optional, Tuple
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from ..models.transaction import Transaction, TransactionType
from ..models.category import Category, CategoryType
from ..models.term import Term
from ..models.user import User
from ..schemas.report import ReportSummary, CategoryBreakdown, ReportResponse, CashFlowPoint, DashboardSummary
from ..config import settings

class ReportService:
    @staticmethod
    async def get_dashboard_summary(db: AsyncSession) -> DashboardSummary:
        today = date.today()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        
        # Today
        in_today = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.INFLOW, Transaction.transaction_date == today
        )) or Decimal(0)
        out_today = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.OUTFLOW, Transaction.transaction_date == today
        )) or Decimal(0)
        
        # Month
        in_month = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.INFLOW, Transaction.transaction_date >= month_start
        )) or Decimal(0)
        out_month = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.OUTFLOW, Transaction.transaction_date >= month_start
        )) or Decimal(0)
        
        # Year
        in_year = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.INFLOW, Transaction.transaction_date >= year_start
        )) or Decimal(0)
        out_year = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.OUTFLOW, Transaction.transaction_date >= year_start
        )) or Decimal(0)
        
        # Active Term
        active_term = await db.scalar(select(Term).filter(Term.is_active == True))
        if active_term:
            in_term = await db.scalar(select(func.sum(Transaction.amount)).filter(
                Transaction.type == TransactionType.INFLOW, Transaction.term_id == active_term.id
            )) or Decimal(0)
            out_term = await db.scalar(select(func.sum(Transaction.amount)).filter(
                Transaction.type == TransactionType.OUTFLOW, Transaction.term_id == active_term.id
            )) or Decimal(0)
        else:
            in_term = out_term = Decimal(0)
            
        # Net Balance
        net_balance = (await db.scalar(select(func.sum(Transaction.amount)).filter(Transaction.type == TransactionType.INFLOW)) or Decimal(0)) - \
                      (await db.scalar(select(func.sum(Transaction.amount)).filter(Transaction.type == TransactionType.OUTFLOW)) or Decimal(0))
        
        # Recent Transactions
        recent_query = select(Transaction).order_by(Transaction.created_at.desc()).limit(10)
        recent_result = await db.execute(recent_query)
        recent_transactions = recent_result.scalars().all()
        
        # Monthly Cashflow (last 12 months)
        monthly_cashflow = []
        for i in range(11, -1, -1):
            target_month = (datetime.now() - timedelta(days=i*30)).replace(day=1)
            next_month = (target_month + timedelta(days=32)).replace(day=1)
            
            in_val = await db.scalar(select(func.sum(Transaction.amount)).filter(
                Transaction.type == TransactionType.INFLOW,
                Transaction.transaction_date >= target_month,
                Transaction.transaction_date < next_month
            )) or Decimal(0)
            
            out_val = await db.scalar(select(func.sum(Transaction.amount)).filter(
                Transaction.type == TransactionType.OUTFLOW,
                Transaction.transaction_date >= target_month,
                Transaction.transaction_date < next_month
            )) or Decimal(0)
            
            monthly_cashflow.append(CashFlowPoint(
                month=target_month.strftime("%b %Y"),
                inflows=in_val,
                outflows=out_val
            ))
            
        # Top Inflow/Outflow Categories
        top_in = await ReportService._get_top_categories(db, TransactionType.INFLOW)
        top_out = await ReportService._get_top_categories(db, TransactionType.OUTFLOW)
        
        return DashboardSummary(
            total_inflows_today=in_today,
            total_outflows_today=out_today,
            total_inflows_month=in_month,
            total_outflows_month=out_month,
            total_inflows_term=in_term,
            total_outflows_term=out_term,
            total_inflows_year=in_year,
            total_outflows_year=out_year,
            net_balance=net_balance,
            recent_transactions=recent_transactions,
            monthly_cashflow=monthly_cashflow,
            top_inflow_categories=top_in,
            top_outflow_categories=top_out
        )

    @staticmethod
    async def _get_top_categories(db: AsyncSession, type: TransactionType) -> List[CategoryBreakdown]:
        query = select(
            Category.id, Category.name, func.sum(Transaction.amount)
        ).join(Transaction, Transaction.category_id == Category.id).filter(
            Transaction.type == type
        ).group_by(Category.id, Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5)
        
        result = await db.execute(query)
        rows = result.all()
        
        total_sum = sum(row[2] for row in rows) if rows else 1
        
        return [
            CategoryBreakdown(
                category_id=str(row[0]),
                category_name=row[1],
                total_amount=row[2],
                percentage=float((row[2] / total_sum) * 100) if total_sum > 0 else 0
            ) for row in rows
        ]

    @staticmethod
    async def generate_report_data(
        db: AsyncSession, 
        period: str = "monthly", 
        date_from: Optional[date] = None, 
        date_to: Optional[date] = None, 
        term_id: Optional[uuid.UUID] = None,
        type: str = "all"
    ) -> ReportResponse:
        # Calculate dates based on period if not provided
        if not date_from:
            if period == "daily":
                date_from = date.today()
            elif period == "weekly":
                date_from = date.today() - timedelta(days=7)
            elif period == "monthly":
                date_from = date.today().replace(day=1)
            elif period == "termly" and term_id:
                term = await db.get(Term, term_id)
                if term:
                    date_from = term.start_date
                    date_to = term.end_date
            elif period == "yearly":
                date_from = date.today().replace(month=1, day=1)
            else:
                date_from = date.today().replace(day=1)
        
        if not date_to:
            date_to = date.today()
            
        # Opening balance (sum of all before date_from)
        op_in = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.INFLOW, Transaction.transaction_date < date_from
        )) or Decimal(0)
        op_out = await db.scalar(select(func.sum(Transaction.amount)).filter(
            Transaction.type == TransactionType.OUTFLOW, Transaction.transaction_date < date_from
        )) or Decimal(0)
        opening_balance = op_in - op_out
        
        # Filter transactions
        filters = [
            Transaction.transaction_date >= date_from,
            Transaction.transaction_date <= date_to
        ]
        if term_id:
            filters.append(Transaction.term_id == term_id)
        if type == "inflow":
            filters.append(Transaction.type == TransactionType.INFLOW)
        elif type == "outflow":
            filters.append(Transaction.type == TransactionType.OUTFLOW)
            
        query = select(Transaction).filter(and_(*filters)).order_by(Transaction.transaction_date.asc())
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Summary
        inflows = sum(t.amount for t in transactions if t.type == TransactionType.INFLOW)
        outflows = sum(t.amount for t in transactions if t.type == TransactionType.OUTFLOW)
        net_pos = inflows - outflows
        closing_balance = opening_balance + net_pos
        
        # Category Breakdown
        cat_query = select(
            Category.id, Category.name, func.sum(Transaction.amount)
        ).join(Transaction, Transaction.category_id == Category.id).filter(
            and_(*filters)
        ).group_by(Category.id, Category.name)
        cat_result = await db.execute(cat_query)
        cat_rows = cat_result.all()
        
        total_for_cat = sum(row[2] for row in cat_rows) if cat_rows else 1
        category_breakdown = [
            CategoryBreakdown(
                category_id=str(row[0]),
                category_name=row[1],
                total_amount=row[2],
                percentage=float((row[2] / total_for_cat) * 100) if total_for_cat > 0 else 0
            ) for row in cat_rows
        ]
        
        report_title = f"{period.capitalize()} Financial Report"
        if period == "termly" and term_id:
            term = await db.get(Term, term_id)
            if term: report_title = f"Financial Report for {term.name}"
            
        return ReportResponse(
            summary=ReportSummary(
                total_inflows=inflows,
                total_outflows=outflows,
                net_position=net_pos,
                transaction_count=len(transactions)
            ),
            transactions=transactions,
            category_breakdown=category_breakdown,
            opening_balance=opening_balance,
            closing_balance=closing_balance,
            generated_at=datetime.utcnow(),
            report_title=report_title,
            period=f"{date_from.strftime('%d %b %Y')} - {date_to.strftime('%d %b %Y')}"
        )

    @staticmethod
    async def generate_pdf(report: ReportResponse) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Styles
        title_style = ParagraphStyle(
            'TitleStyle', parent=styles['Heading1'], alignment=1, fontSize=20, spaceAfter=20
        )
        sub_title_style = ParagraphStyle(
            'SubTitleStyle', parent=styles['Heading2'], alignment=1, fontSize=14, spaceAfter=10
        )
        section_style = ParagraphStyle(
            'SectionStyle', parent=styles['Heading3'], fontSize=12, spaceBefore=15, spaceAfter=10
        )
        
        # Cover Page
        elements.append(Spacer(1, 100))
        elements.append(Paragraph(settings.SCHOOL_NAME.upper(), title_style))
        elements.append(Paragraph(report.report_title, sub_title_style))
        elements.append(Paragraph(f"Period: {report.period}", styles['Normal']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Generated At: {report.generated_at.strftime('%d %b %Y %H:%M')}", styles['Normal']))
        elements.append(PageBreak())
        
        # Summary Section
        elements.append(Paragraph("Financial Summary", section_style))
        data = [
            ["Opening Balance:", f"UGX {report.opening_balance:,.2f}"],
            ["Total Inflows:", f"UGX {report.summary.total_inflows:,.2f}"],
            ["Total Outflows:", f"UGX {report.summary.total_outflows:,.2f}"],
            ["Net Position:", f"UGX {report.summary.net_position:,.2f}"],
            ["Closing Balance:", f"UGX {report.closing_balance:,.2f}"],
        ]
        t = Table(data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ]))
        elements.append(t)
        
        # Category Breakdown
        elements.append(Paragraph("Category Breakdown", section_style))
        cat_data = [["Category", "Amount", "Percentage"]]
        for cat in report.category_breakdown:
            cat_data.append([cat.category_name, f"UGX {cat.total_amount:,.2f}", f"{cat.percentage:.1f}%"])
        
        t_cat = Table(cat_data, colWidths=[200, 150, 100])
        t_cat.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.indigo),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t_cat)
        
        # Transaction List (Paginated)
        elements.append(PageBreak())
        elements.append(Paragraph("Transaction Details", section_style))
        
        trans_data = [["Date", "Ref", "Description", "Type", "Amount"]]
        for tr in report.transactions:
            trans_data.append([
                tr.transaction_date.strftime("%d/%m/%Y"),
                tr.reference_number,
                tr.description[:30] + "..." if len(tr.description) > 30 else tr.description,
                tr.type.value.capitalize(),
                f"{tr.amount:,.2f}"
            ])
            
        t_trans = Table(trans_data, colWidths=[70, 80, 200, 60, 80], repeatRows=1)
        t_trans.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.indigo),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t_trans)
        
        # Final Footer
        elements.append(Spacer(1, 50))
        elements.append(Paragraph("____________________________", styles['Normal']))
        elements.append(Paragraph("Authorized Signature", styles['Normal']))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
