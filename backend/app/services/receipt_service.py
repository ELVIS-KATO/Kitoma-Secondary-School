import uuid
from datetime import datetime
from io import BytesIO
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from reportlab.lib.pagesizes import A5
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from ..models.receipt import Receipt
from ..models.transaction import Transaction, TransactionType
from ..models.user import User
from ..config import settings

def number_to_words_ugx(amount: float) -> str:
    """Simple converter for UGX amount to words."""
    # Simplified version for now
    amount_int = int(amount)
    # This is a placeholder for a real number-to-words logic
    # In a real app, use a library like `num2words`
    return f"{amount_int:,} Shillings Only"

class ReceiptService:
    @staticmethod
    async def generate_receipt_number(db: AsyncSession) -> str:
        year = datetime.now().year
        # Get the highest current receipt number for the year to avoid duplicates
        query = select(Receipt.receipt_number).filter(
            Receipt.receipt_number.like(f"KSS-{year}-%")
        ).order_by(Receipt.receipt_number.desc()).limit(1)
        
        last_number = await db.scalar(query)
        
        if last_number:
            try:
                # Extract the numeric part (e.g., KSS-2026-00029 -> 29)
                last_count = int(last_number.split("-")[-1])
                new_count = last_count + 1
            except (ValueError, IndexError):
                # Fallback if format is unexpected
                query_count = select(func.count(Receipt.id)).filter(
                    Receipt.receipt_number.like(f"KSS-{year}-%")
                )
                new_count = (await db.scalar(query_count)) + 1
        else:
            new_count = 1
            
        return f"KSS-{year}-{new_count:05d}"

    @staticmethod
    async def create_receipt(
        db: AsyncSession, 
        transaction: Transaction, 
        issued_by_id: uuid.UUID
    ) -> Receipt:
        receipt_number = await ReceiptService.generate_receipt_number(db)
        
        receipt = Receipt(
            receipt_number=receipt_number,
            transaction_id=transaction.id,
            issued_to=transaction.payer_name or "N/A",
            issued_by=issued_by_id,
            issued_at=datetime.utcnow()
        )
        
        db.add(receipt)
        await db.flush()
        return receipt

    @staticmethod
    async def generate_pdf(receipt: Receipt, db: AsyncSession) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A5)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            alignment=1, # Center
            fontSize=16,
            spaceAfter=10
        )
        
        # Header
        elements.append(Paragraph(settings.SCHOOL_NAME.upper(), title_style))
        elements.append(Paragraph(settings.SCHOOL_ADDRESS, styles['Normal']))
        elements.append(Paragraph(f"Tel: {settings.SCHOOL_PHONE}", styles['Normal']))
        elements.append(Spacer(1, 10))
        
        # Receipt Details
        # Load transaction with term to avoid lazy loading issues
        result = await db.execute(
            select(Transaction)
            .options(joinedload(Transaction.term))
            .filter(Transaction.id == receipt.transaction_id)
        )
        transaction = result.scalar_one()
        
        doc_title = "OFFICIAL RECEIPT" if transaction.type == TransactionType.INFLOW else "PAYMENT VOUCHER"
        elements.append(Paragraph(doc_title, title_style))
        elements.append(Spacer(1, 5))
        
        payer_label = "Received From:" if transaction.type == TransactionType.INFLOW else "Paid To:"
        
        data = [
            ["No:", receipt.receipt_number, "Date:", transaction.transaction_date.strftime("%d %b %Y")],
            [payer_label, receipt.issued_to, "", ""],
            ["Amount:", f"UGX {transaction.amount:,.2f}", "", ""],
            ["In Words:", number_to_words_ugx(float(transaction.amount)), "", ""],
            ["Purpose:", transaction.description, "", ""],
            ["Method:", transaction.payment_method.value.replace("_", " ").title(), "Term:", transaction.term.name if transaction.term else "N/A"],
        ]
        
        t = Table(data, colWidths=[80, 150, 40, 80])
        t.setStyle(TableStyle([
            ('SPAN', (1, 1), (3, 1)), # Span name
            ('SPAN', (1, 2), (3, 2)), # Span amount
            ('SPAN', (1, 3), (3, 3)), # Span words
            ('SPAN', (1, 4), (3, 4)), # Span description
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t)
        
        elements.append(Spacer(1, 20))
        
        # Footer
        result = await db.execute(select(User).filter(User.id == receipt.issued_by))
        issuer = result.scalar_one()
        
        elements.append(Paragraph(f"Recorded By: {issuer.name}", styles['Normal']))
        elements.append(Paragraph("Signature: ___________________", styles['Normal']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("* This is a computer-generated receipt and is valid without a physical signature.", styles['Italic']))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
