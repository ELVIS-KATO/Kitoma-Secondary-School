import uuid
from datetime import datetime
from io import BytesIO
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
        # Count existing receipts for the year
        query = select(func.count(Receipt.id)).filter(
            Receipt.receipt_number.like(f"KSS-{year}-%")
        )
        count = await db.scalar(query)
        return f"KSS-{year}-{(count + 1):05d}"

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
        
        elements.append(Paragraph("OFFICIAL RECEIPT", title_style))
        elements.append(Spacer(1, 5))
        
        # Receipt Details
        # Load transaction to get amount, etc.
        result = await db.execute(
            select(Transaction).filter(Transaction.id == receipt.transaction_id)
        )
        transaction = result.scalar_one()
        
        data = [
            ["Receipt No:", receipt.receipt_number, "Date:", transaction.transaction_date.strftime("%d %b %Y")],
            ["Received From:", receipt.issued_to, "", ""],
            ["Amount:", f"UGX {transaction.amount:,.2f}", "", ""],
            ["In Words:", number_to_words_ugx(float(transaction.amount)), "", ""],
            ["Payment For:", transaction.description, "", ""],
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
