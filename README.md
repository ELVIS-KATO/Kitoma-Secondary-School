# Kitoma Secondary School Accounts Management System

A production-ready, full-stack school accounts management system built with React, FastAPI, and MySQL.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Zustand, Axios
- **Backend**: Python 3.11, FastAPI, SQLAlchemy (Async), MySQL 8, Alembic
- **Auth**: JWT (Access + Refresh Tokens)
- **PDF**: reportlab (Backend), @react-pdf/renderer (Frontend placeholder)
- **Deployment**: Docker, Docker Compose

## Features

- **Dashboard**: KPI cards, cash flow trends, expense breakdown, and quick stats.
- **Inflows & Outflows**: Full CRUD with automatic reference generation and receipt issuance.
- **Reports**: Generate daily, weekly, monthly, termly, and yearly financial statements with PDF/CSV export.
- **Receipts**: Professional, printable receipts for all school transactions.
- **Category Management**: Organized tracking of income and expenses.
- **Term Management**: Academic period tracking with active term status.
- **User Management**: Role-based access control (Admin, Accountant, Viewer).
- **Audit Logs**: Comprehensive tracking of all system actions.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- MySQL 8 (for local development)
- Rust (for local development, required for compiling reportlab)

### Quick Start with Docker

1. Clone the repository
2. Run Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

### Local Development Setup

#### Backend

1. Navigate to `backend/`
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # or source venv/bin/activate on Linux/Mac
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on `.env.example`.
4. Run the seed script:
   ```bash
   python seed.py
   ```
5. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Default Credentials

- **Admin**: `admin@kitoma.ac.ug` / `Admin@1234`
- **Accountant**: `accountant@kitoma.ac.ug` / `Accountant@1234`
- **Viewer**: `viewer@kitoma.ac.ug` / `Viewer@1234`

## License

Copyright © 2026 Kitoma Secondary School. All rights reserved.
