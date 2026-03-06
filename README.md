# Airight

Airight is an **AI-powered risk intelligence platform** focused on helping operations and supply-chain teams monitor emerging threats, understand business impact quickly, and track mitigation work.

At a high level, Airight combines:

- **Frontend:** Next.js (TypeScript) dashboard for onboarding, risk feed, graph views, and action tracking.
- **Backend:** FastAPI + SQLAlchemy APIs for users, business context, risks, news, and agent orchestration.
- **Database:** PostgreSQL (configured via environment variables).

## What this project provides

This repository provides an end-to-end MVP foundation for:

1. **Company context onboarding**  
   Capture business profile inputs (company, products, competitors, regions) that scope risk monitoring.
2. **Risk intelligence feed**  
   Display detected risks, supporting news context, and suggested mitigation actions.
3. **Dependency visibility**  
   Retrieve and render business dependency graphs (entities + routes) to understand blast radius.
4. **Action lifecycle updates**  
   Update mitigation/action status through API endpoints.
5. **Agent-driven analysis flow**  
   Trigger a backend agent flow that can run risk-detection and planning against business context.

## Repository structure

```text
.
├── backend/    # FastAPI API service and data models
└── frontend/   # Next.js client application
```

## High-level request flow

- Users authenticate/register through backend user routes.
- Frontend dashboard loads business context by `business_id`.
- Frontend fetches business risks, relevant news, and dependency graph data.
- Users update action status through action routes.
- Optional agent flow endpoint runs orchestration for deeper AI-assisted analysis.

## Current API surface (backend)

Base path examples:

- `POST /api/user/register` – register user + create initial business
- `POST /api/user/login` – user login
- `GET /api/business/{business_id}` – fetch business profile
- `PATCH /api/business/{business_id}` – update business profile
- `GET /api/business/{business_id}/risks` – list risks for business
- `GET /api/business/{business_id}/news` – list relevant news
- `GET /api/business/{business_id}/graph` – fetch entity/route graph
- `PATCH /api/action/{action_id}` – update mitigation action status
- `POST /api/agent/flow` – run full agent-driven risk analysis flow

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- PostgreSQL database (local or hosted)

## Backend setup (`backend/`)

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in `backend/` with:

   ```env
   dbuser=your_db_user
   dbpassword=your_db_password
   dbhost=your_db_host
   dbport=5432
   dbname=your_db_name
   ```

4. Start the API server:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`.

## Frontend setup (`frontend/`)

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Configure frontend environment variable (example):

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## Common scripts

### Frontend

From `frontend/`:

- `npm run dev` – start dev server
- `npm run build` – create production build
- `npm run start` – start production server
- `npm run lint` – run ESLint checks

### Backend

From `backend/`:

- `uvicorn app.main:app --reload` – start development API server

## Notes

- The backend currently initializes tables on startup with `Base.metadata.create_all(...)`.
- CORS is configured for local frontend (`http://localhost:3000`) and production domains.
- Some frontend lint/type issues may already exist in the codebase and are not introduced by README updates.
