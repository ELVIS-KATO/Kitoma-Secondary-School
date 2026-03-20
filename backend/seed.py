import asyncio
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.database import Base
from app.models.user import User, UserRole
from app.models.category import Category, CategoryType
from app.models.term import Term, TermNumber
from app.models.transaction import Transaction, TransactionType, PaymentMethod
from app.models.receipt import Receipt
from app.utils.security import get_password_hash
from app.services.receipt_service import ReceiptService

# Use a separate engine for seeding to ensure it's synchronous-like or handled correctly
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def seed():
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        print("Seeding database...")
        
        # 1. Create Users
        print("Creating users...")
        admin = User(
            name="Admin User",
            email="admin@kitoma.ac.ug",
            password_hash=get_password_hash("Admin@1234"),
            role=UserRole.ADMIN,
            is_active=True
        )
        accountant = User(
            name="Accountant User",
            email="accountant@kitoma.ac.ug",
            password_hash=get_password_hash("Accountant@1234"),
            role=UserRole.ACCOUNTANT,
            is_active=True
        )
        viewer = User(
            name="Viewer User",
            email="viewer@kitoma.ac.ug",
            password_hash=get_password_hash("Viewer@1234"),
            role=UserRole.VIEWER,
            is_active=True
        )
        db.add_all([admin, accountant, viewer])
        await db.flush()
        
        # 2. Create Categories
        print("Creating categories...")
        in_categories = [
            ("School Fees", "Regular tuition fees"),
            ("Exam Fees", "External and internal examination fees"),
            ("Donations", "Gifts from alumni and well-wishers"),
            ("Government Grant", "Quarterly capitation grant"),
            ("Other Income", "Miscellaneous income sources")
        ]
        out_categories = [
            ("Salaries", "Staff monthly salaries"),
            ("Utilities", "Water, electricity, and internet"),
            ("Stationery", "Office and classroom supplies"),
            ("Maintenance", "Repairs and campus upkeep"),
            ("Transport", "Fuel and vehicle maintenance"),
            ("Food", "Student and staff meals"),
            ("Other Expenses", "Miscellaneous operational costs")
        ]
        
        cat_objs = []
        for name, desc in in_categories:
            cat_objs.append(Category(name=name, description=desc, type=CategoryType.INFLOW))
        for name, desc in out_categories:
            cat_objs.append(Category(name=name, description=desc, type=CategoryType.OUTFLOW))
        db.add_all(cat_objs)
        await db.flush()
        
        # 3. Create Terms
        print("Creating terms...")
        year = date.today().year
        terms = [
            Term(name=f"Term 1 {year}", year=year, term_number=TermNumber.TERM_1, start_date=date(year, 2, 1), end_date=date(year, 5, 10), is_active=True),
            Term(name=f"Term 2 {year}", year=year, term_number=TermNumber.TERM_2, start_date=date(year, 6, 1), end_date=date(year, 8, 20), is_active=False),
            Term(name=f"Term 3 {year}", year=year, term_number=TermNumber.TERM_3, start_date=date(year, 9, 15), end_date=date(year, 11, 30), is_active=False)
        ]
        db.add_all(terms)
        await db.flush()
        
        # 4. Create Transactions & Receipts
        print("Creating sample transactions...")
        payment_methods = list(PaymentMethod)
        in_cats = [c for c in cat_objs if c.type == CategoryType.INFLOW]
        out_cats = [c for c in cat_objs if c.type == CategoryType.OUTFLOW]
        
        # Generate 50 transactions
        for i in range(50):
            t_type = random.choices([TransactionType.INFLOW, TransactionType.OUTFLOW], weights=[0.6, 0.4])[0]
            cat = random.choice(in_cats if t_type == TransactionType.INFLOW else out_cats)
            term = terms[0] if i < 40 else terms[1]
            
            # Random date within last 60 days
            t_date = date.today() - timedelta(days=random.randint(0, 60))
            
            amount = Decimal(random.randint(50, 2000)) * 500 # Realistic amounts
            
            payer = f"Student {random.randint(100, 999)}" if t_type == TransactionType.INFLOW else None
            
            transaction = Transaction(
                type=t_type,
                amount=amount,
                description=f"Payment for {cat.name} - #{i+1}",
                category_id=cat.id,
                term_id=term.id,
                payer_name=payer,
                reference_number=f"REF-{uuid.uuid4().hex[:8].upper()}",
                payment_method=random.choice(payment_methods),
                transaction_date=t_date,
                recorded_by=accountant.id
            )
            db.add(transaction)
            await db.flush()
            
            if t_type == TransactionType.INFLOW:
                receipt_num = f"KSS-{t_date.year}-{(i+1):05d}"
                receipt = Receipt(
                    receipt_number=receipt_num,
                    transaction_id=transaction.id,
                    issued_to=payer,
                    issued_by=accountant.id,
                    issued_at=datetime.combine(t_date, datetime.now().time())
                )
                db.add(receipt)
                transaction.receipt_issued = True
                
        await db.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
