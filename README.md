# PISA Performance

Predict and explain student math performance using PISA indicators. A full-stack application that wraps a machine learning pipeline (Ridge + XGBoost with SHAP explanations) into a teacher-facing web interface.

## Architecture

```
Frontend (Next.js)  →  Backend (FastAPI)  →  ML Pipeline (scikit-learn + XGBoost)
                                           →  Groq LLM (chat)
                                           →  Supabase (PostgreSQL + Auth)
```

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with JWT auth, Supabase client, Groq LLM integration
- **ML Pipeline**: Ridge regression + XGBoost trained on PISA 2022 data, SHAP TreeExplainer for feature attributions
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Chat**: Groq API (`llama-3.3-70b-versatile`) for AI-powered student analysis

## Features

- Teacher authentication (signup/login)
- Student CRUD with 40+ PISA indicator profile
- ML predictions with dual-model scoring (Ridge + XGBoost)
- SHAP-based explanations showing positive/negative factors
- AI chat grounded in student data and predictions
- Notes with inline edit/delete
- Auto-generated summaries from chat history
- Timeline view of all student activity
- Field validation with range warnings
- Responsive design (desktop + tablet)

## Local Setup

### Prerequisites

- Python 3.11 or 3.12
- Node.js 18+
- A Supabase project (free tier works)
- PISA data files (`.parquet` format) in `data/raw/`

### 1. Clone and install

```bash
# Python dependencies
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -r backend/requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (Settings > API) |
| `SUPABASE_KEY` | Service-role key (Settings > API > service_role) |
| `SUPABASE_JWT_SECRET` | JWT secret (Settings > API > JWT Secret) |
| `GROQ_API_KEY` | Groq API key (optional, enables AI chat) |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:3000`) |
| `ML_MODEL_VERSION` | Version tag stored with predictions (default: `v1`) |
| `DEBUG` | Set to `true` for development (default: `false`) |

For the frontend, create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Database migrations

Run the migration SQL in your Supabase dashboard:

1. Go to **SQL Editor** in the Supabase dashboard
2. Paste the contents of `backend/migrations/001_initial_schema.sql`
3. Click **Run**

This creates all 9 tables with RLS policies, indexes, and triggers.

### 4. Data files

Place the PISA data files in the project:

```
data/raw/CY08MSP_STU_QQQ.parquet
data/raw/CY08MSP_SCH_QQQ.parquet
```

If you have `.sav` files instead, convert them first:

```bash
PYTHONPATH=src python src/pisa_app/ml/convert_sav_to_parquet.py
```

### 5. Start the backend

```bash
cd backend
PYTHONPATH=../src:. uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Check health: `http://localhost:8000/health`

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

### 7. Seed demo data (optional)

```bash
PYTHONPATH=src:backend python scripts/seed_demo_data.py
```

This creates a demo teacher (`demo@pisaperformance.test` / `demo123456`) with 4 sample students including filled profiles, predictions, and notes.

## Docker

```bash
# Build and run the backend
docker-compose up --build

# The backend will be available at http://localhost:8000
```

The frontend is deployed separately (Vercel, Netlify, or any static host). Set `NEXT_PUBLIC_API_URL` to point to the backend.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── auth/          # JWT auth, signup/login
│   │   ├── students/      # Student CRUD, profiles, validation
│   │   ├── predictions/   # ML prediction endpoints
│   │   ├── explanations/  # SHAP explanation endpoints
│   │   ├── chat/          # Groq LLM chat with rate limiting
│   │   ├── notes/         # Teacher notes CRUD
│   │   ├── summaries/     # AI-generated summaries
│   │   ├── config.py      # Pydantic settings
│   │   ├── database.py    # Supabase client
│   │   └── main.py        # FastAPI app + CORS + routers
│   ├── migrations/        # SQL schema
│   ├── ml_interface.py    # ML pipeline wrapper
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/           # Next.js pages (App Router)
│       ├── components/    # React components
│       ├── hooks/         # Custom hooks
│       └── lib/           # API client, types, auth, fields
├── src/
│   └── pisa_app/ml/       # ML pipeline (training steps)
├── data/raw/              # PISA data files
├── scripts/               # Seed scripts
└── docker-compose.yml
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/students` | List / create students |
| GET/PUT/DELETE | `/api/students/{id}` | Student CRUD |
| PUT | `/api/students/{id}/profile` | Update PISA indicators |
| GET | `/api/students/{id}/validation` | Check profile completeness |
| POST | `/api/students/{id}/predict` | Generate prediction |
| GET | `/api/students/{id}/predictions` | Prediction history |
| GET | `/api/students/{id}/explanations/latest` | Latest SHAP explanation |
| POST/GET | `/api/chat` | Send message / history |
| POST/GET/PUT/DELETE | `/api/students/{id}/notes` | Notes CRUD |
| GET | `/api/students/{id}/summaries` | AI summaries |
