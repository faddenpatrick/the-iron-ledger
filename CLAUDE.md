# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Iron Ledger** is a self-hosted Progressive Web App (PWA) for tracking workouts and nutrition with offline-first functionality. It is a monorepo with a FastAPI (Python) backend, a React 18 + TypeScript frontend, and PostgreSQL database.

## Commands

### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head                        # Run migrations
python scripts/seed_exercises.py            # Seed exercise data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Dev server
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Dev server on port 5173
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint (zero warnings allowed)
```

### Docker (Production)

```bash
make build           # Build Docker images
make up              # Start all services
make down            # Stop services
make logs            # View all logs
make logs-backend    # Backend logs only
make db-shell        # Connect to PostgreSQL
make db-backup       # Backup database
make deploy          # Full deployment (pull, build, restart)
```

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                              # Apply migrations
alembic downgrade -1                              # Rollback one step
```

## Architecture

### Three-Tier Structure

```
Frontend (React PWA, Nginx:80) → Backend (FastAPI, uvicorn:8000) → PostgreSQL:5432
```

The frontend communicates with the backend via Axios. The backend uses SQLAlchemy ORM against PostgreSQL. In production, all services run as Docker containers orchestrated by Docker Compose, with Watchtower providing automatic updates from GHCR.

### Backend (`/backend/app/`)

- `main.py` — FastAPI app init, CORS configuration, router registration
- `config.py` — Pydantic settings loaded from environment variables
- `database.py` — SQLAlchemy session management
- `core/security.py` — JWT token creation/verification, bcrypt password hashing
- `models/` — SQLAlchemy ORM models: `user.py`, `exercise.py`, `workout.py`, `nutrition.py`
- `schemas/` — Pydantic request/response validation schemas
- `api/v1/` — Route handlers grouped by domain:
  - `auth.py` — Register, login, token refresh
  - `exercises.py` — Exercise CRUD (system + custom)
  - `workouts.py` — Templates, workout sessions, sets
  - `nutrition.py` — Meal categories, foods, meals, meal items
  - `settings.py` — User preferences, macro targets
  - `openfoodfacts.py` — External food database proxy

**Data integrity pattern:** When a base entity (exercise, food, category) is edited, the system creates a snapshot on the referencing record. This preserves historical accuracy on past workouts and meals even when the original entity changes.

**Authentication:** JWT access tokens (15 min) + refresh tokens (7 days). The frontend handles automatic token refresh via Axios interceptors.

### Frontend (`/frontend/src/`)

- `contexts/` — `AuthContext.tsx` (JWT state, login/logout), `SyncContext.tsx` (offline sync state)
- `services/` — `api.ts` (Axios instance + interceptors), `db.ts` (Dexie/IndexedDB schema), `sync.ts` (offline-to-online sync), `nutritionService.ts`, `workoutService.ts`
- `hooks/` — `useWorkout`, `useNutrition`, `useAuth`, `useSync`, `useInstallPrompt`
- `components/` — Feature components grouped by domain (workout: 9, nutrition: 12, layout: 2)
- `types/` — TypeScript interfaces matching backend schemas
- `App.tsx` — React Router setup with protected/public route splits

**Offline-first pattern:** Data is read from and written to IndexedDB (Dexie) first. A sync service reconciles local changes with the backend when connectivity is restored. The Workbox service worker uses NetworkFirst for API calls and CacheFirst for static assets/fonts.

### Database Schema

11 tables with UUID primary keys. Key relationships:
- `users` → `user_settings`, `exercises` (custom), `workout_templates`, `workouts`, `meal_categories`, `foods` (custom), `meals`
- `workout_templates` → `template_exercises` → `exercises`
- `workouts` → `sets` (stores exercise snapshot inline)
- `meals` → `meal_items` → `foods` (stores food/category snapshots inline)

### CI/CD

GitHub Actions (`.github/workflows/build-and-push.yml`) triggers on push to `main`, builds backend and frontend Docker images, and pushes to GHCR. Production servers run Watchtower which polls GHCR and auto-updates containers when new images are pushed.

## Environment Configuration

Copy `.env.example` to `.env` and fill in values. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing key (generate with `openssl rand -hex 32`)
- `BACKEND_CORS_ORIGINS` — Comma-separated allowed frontend origins
- `VITE_API_URL` — Backend URL used at frontend build time

## Key Technical Decisions

- **Path alias:** `@/*` maps to `frontend/src/*` in TypeScript and Vite
- **Tailwind CSS** for all styling — no CSS modules or styled-components
- **Dexie 4** wraps IndexedDB; all offline storage schema lives in `services/db.ts`
- **ESLint is zero-warnings** (`--max-warnings=0`); lint must pass before committing
- **No automated tests** exist currently — manual testing via `/docs` (Swagger UI) and frontend at `http://localhost:5173`
