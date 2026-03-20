from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, transactions, reports, receipts, categories, terms, dashboard, users
from .database import engine, Base
from .config import settings

app = FastAPI(
    title="Kitoma Secondary School Accounts Management API",
    description="Production-ready API for school financial management",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(receipts.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(terms.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.SCHOOL_NAME} Accounts Management System API",
        "status": "online"
    }

# Startup event to create tables if they don't exist (useful for development)
# In production, use Alembic migrations
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Careful with this
        await conn.run_sync(Base.metadata.create_all)
