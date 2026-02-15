# HealthApp - Project Continuation Prompt

## Overview
I'm building a **Progressive Web App (PWA)** for tracking workouts and nutrition with complete offline functionality. The app is designed for personal use, accessible via Tailscale network, with potential future public access. The core principle is **offline-first architecture** - it must work seamlessly in the gym without internet, syncing data when connectivity returns.

## Technology Stack
- **Backend**: FastAPI (Python) with SQLAlchemy ORM, PostgreSQL, JWT authentication
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL 16 with UUID primary keys for offline sync
- **PWA**: Workbox service workers, Dexie.js for IndexedDB
- **Deployment**: Running on server at 192.168.1.44

## Server Access
- **SSH**: `ssh patrick@192.168.1.44`
- **Project Location**: `/home/patrick/HealthApp/`
- **Backend**: Running on port 8000
- **Frontend**: Running on port 5173
- **Database**: PostgreSQL in Docker container

## Current URLs
- **Frontend**: http://192.168.1.44:5173
- **Backend API**: http://192.168.1.44:8000
- **API Docs**: http://192.168.1.44:8000/docs

## Project Structure
```
HealthApp/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py (CORS: includes 192.168.1.44:5173)
│   │   ├── database.py
│   │   ├── models/ (user, exercise, workout, nutrition)
│   │   ├── schemas/
│   │   ├── api/v1/ (auth, exercises, workouts, nutrition)
│   │   ├── core/ (security - JWT)
│   │   └── migrations/
│   ├── scripts/seed_exercises.py (106 exercises loaded)
│   ├── venv/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx (PWA service worker registration)
│   │   ├── App.tsx (routing + SyncProvider)
│   │   ├── components/
│   │   │   ├── layout/ (Header with sync indicators, BottomNav)
│   │   │   └── features/ (workout/, nutrition/)
│   │   ├── pages/ (LoginPage, Dashboard, WorkoutPage, NutritionPage, SettingsPage)
│   │   ├── hooks/ (useRestTimer, useWorkout, useNutrition)
│   │   ├── context/ (AuthContext, SyncContext)
│   │   ├── services/
│   │   │   ├── api.ts (Axios with JWT interceptors)
│   │   │   ├── indexeddb.service.ts (Dexie database)
│   │   │   ├── sync.service.ts (offline sync queue)
│   │   │   ├── workout.service.ts (offline-first)
│   │   │   └── nutrition.service.ts (offline-first)
│   │   └── types/ (workout.ts, nutrition.ts, auth.ts)
│   ├── vite.config.ts (VitePWA plugin configured)
│   └── dist/ (built PWA with sw.js, manifest.webmanifest)
├── .env (SECRET_KEY, CORS_ORIGINS, DATABASE_URL)
└── docker-compose.yml (PostgreSQL)
```

## Database Schema (11 Tables)
All tables use UUID primary keys for offline sync compatibility.

**Core Design Principles:**
- **Snapshot Strategy**: Store copies of template names, food macros, exercise names to preserve historical accuracy when base data changes
- **Soft Deletes**: `deleted_at` column for sync reconciliation
- **Timestamps**: `created_at`, `updated_at` on all tables for conflict resolution

**Tables:**
1. **users** - Authentication (id, email, hashed_password)
2. **user_settings** - Preferences, macro targets
3. **exercises** - 106 pre-loaded + custom (id, name, muscle_group, equipment)
4. **workout_templates** - User workout plans
5. **template_exercises** - Exercises in templates
6. **workouts** - Actual sessions (includes `template_name_snapshot`)
7. **sets** - Individual sets (includes `exercise_name_snapshot`)
8. **meal_categories** - User-defined (NO defaults - user creates their own)
9. **foods** - Nutrition database + custom foods
10. **meals** - Meal sessions (includes `category_name_snapshot`)
11. **meal_items** - Foods in meals (includes macro snapshots)

## What's Been Completed (Phases 1-7, 70%)

### ✅ Phase 1: Foundation (Database & Backend Core)
- PostgreSQL in Docker
- 11-table schema with Alembic migrations
- JWT authentication (15min access, 7day refresh)
- 106 home gym exercises seeded (barbell, dumbbell, kettlebell, bodyweight)
- SQLAlchemy models with snapshot fields

### ✅ Phase 2: Workout Backend API
- Exercise CRUD with search/filter
- Template management (create, update, delete)
- Workout logging (from template or freestyle)
- Set tracking with snapshots
- Save workout as template

### ✅ Phase 3: Nutrition Backend API
- Meal category CRUD (user creates their own)
- Food database operations
- Meal logging with items
- Nutrition summary (daily totals vs targets)
- Snapshot strategy for historical accuracy

### ✅ Phase 4: Frontend Foundation
- React + TypeScript + Tailwind CSS
- Dark mode (default)
- React Router with protected routes
- AuthContext with JWT storage & auto-refresh
- Axios client with interceptors
- Mobile-first design

### ✅ Phase 5: Workout Frontend
- 10 files created
- Exercise selector (bottom sheet, searchable)
- Template list & builder
- Workout logger (active session UI)
- Set input (mobile-optimized +/- buttons)
- Rest timer (floating, countdown)
- One-handed operation, thumb-friendly

### ✅ Phase 6: Nutrition Frontend
- 11 files created
- Category selector (horizontal scrolling pills, create on-the-fly)
- Food search (bottom sheet)
- Portion input (stepper controls, real-time macro calc)
- Meal logger (multi-food, running totals)
- Macro summary (4 progress bars: calories, protein, carbs, fat)
- Daily meal list (swipe to delete)

### ✅ Phase 7: PWA & Offline Support
- **IndexedDB Service** (Dexie): 11 tables + sync queue
- **Sync Service**: Queue mutations while offline, auto-sync when online
- **SyncContext**: Online/offline detection, sync status broadcasting
- **Offline-first pattern**: All services use IndexedDB-first (read instantly, background API update)
- **Service Worker**: Vite PWA plugin, caches all assets
- **PWA Manifest**: Installable app, shortcuts for "Log Workout" and "Log Meal"
- **UI Indicators**: Offline badge, syncing spinner, pending count

**Offline-First Strategy:**
```
READ: IndexedDB → Instant UI → API fetch (background) → Update IndexedDB
WRITE (online): IndexedDB + temp ID → API POST → Replace with server data
WRITE (offline): IndexedDB + temp ID → Sync queue → Sync when online
```

## Current Status

### Running Services
- ✅ PostgreSQL: Docker container on localhost:5432
- ✅ Backend: Port 8000 (uvicorn, running in background)
- ✅ Frontend: Port 5173 (vite preview --host --port 5173)

### Recent Fixes
- **CORS Issue Resolved**: Updated `backend/app/config.py` to include `http://192.168.1.44:5173` in CORS_ORIGINS
- Backend restarted with proper CORS headers
- Authentication now working from frontend

### Data Loaded
- 106 exercises in database
- All API endpoints functional
- Complete offline caching enabled

## What Remains (Phases 8-10, 30%)

### Phase 8: Dashboard & Settings (NEXT)
**Goal**: Complete MVP with dashboard and user preferences

**Tasks:**
1. **Dashboard Page** (`src/pages/Dashboard.tsx`):
   - Today's workout summary card
   - Today's macro totals vs targets (progress bars)
   - Quick action buttons: "Start Workout", "Log Meal"
   - Recent activity feed (last 5 workouts/meals)

2. **Settings Page** (`src/pages/SettingsPage.tsx`):
   - Dark mode toggle (already default)
   - Unit preference (lbs/kg)
   - Default rest timer (seconds)
   - Macro targets form (calories, protein, carbs, fat)
   - Logout button

3. **First-time user flow**:
   - After registration, prompt to set macro targets
   - Prompt to create first meal category
   - Optional onboarding tips

**Files to create/update:**
- `src/pages/Dashboard.tsx`
- `src/pages/SettingsPage.tsx` (currently exists but empty)
- Update `src/hooks/useNutrition.ts` if needed
- Update user settings API calls

### Phase 9: Docker & Deployment
**Goal**: Containerize for production deployment

**Tasks:**
1. Create `backend/Dockerfile`
2. Create `frontend/Dockerfile`
3. Update `docker-compose.yml` to include all services
4. Create `nginx/nginx.conf` for reverse proxy
5. Production environment configuration
6. Automated database migrations on startup
7. Health checks for all services

### Phase 10: Testing & Documentation
**Goal**: Ensure reliability and document everything

**Tasks:**
1. Backend unit tests (JWT, macros calculation)
2. Backend integration tests (auth flow, CRUD)
3. Frontend component tests (SetRow, MealLogger)
4. E2E test (login → workout → complete)
5. Complete README.md with setup instructions
6. Document Tailscale configuration
7. Backup/restore procedures

## Key Design Decisions

### No Assumptions
- **NO default meal categories** - users create their own (Breakfast, Lunch, etc.)
- **NO default workout templates** - users build from scratch
- **NO default macro targets** - users set their own goals

### Snapshot Strategy
When saving sets or meals, always snapshot the current state:
```python
# Workout set
set.exercise_name_snapshot = exercise.name  # Preserves even if exercise renamed

# Meal item
meal_item.food_name_snapshot = food.name
meal_item.calories_snapshot = food.calories * servings  # Preserves even if food edited
```

### Mobile-First UI
- Bottom sheet for selections (exercises, foods)
- Horizontal scrolling (categories)
- Large tap targets (min 44x44px)
- Thumb-friendly controls (+/- buttons)
- Swipe gestures (delete)
- One-handed operation

## Common Commands

### Backend
```bash
# Start backend
cd /home/patrick/HealthApp/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check backend logs
tail -f /tmp/backend.log

# Test API
curl http://192.168.1.44:8000/health
curl http://192.168.1.44:8000/docs
```

### Frontend
```bash
# Build
cd /home/patrick/HealthApp/frontend
npm run build

# Start preview
npm run preview -- --host --port 5173

# Check if running
ps aux | grep vite
```

### Database
```bash
# Access PostgreSQL
docker exec -it healthapp_db psql -U healthapp_user -d healthapp

# Check tables
\dt

# Count exercises
SELECT COUNT(*) FROM exercises WHERE is_custom = false;
```

## Important Notes

### Authentication
- JWT tokens stored in localStorage
- Access token: 15 min expiry
- Refresh token: 7 day expiry
- Auto-refresh on 401 responses

### Offline Sync
- All mutations queued when offline
- Auto-sync when connection restored
- Temp UUIDs replaced with server IDs after sync
- Conflict resolution: last-write-wins (timestamp-based)

### CORS Configuration
Backend config.py includes:
```python
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.44:5173",
    "http://192.168.1.44:4173",
]
```

### Service Worker
- Generated by vite-plugin-pwa
- Cache-first for static assets
- Network-first for API calls
- Workbox strategies configured
- Auto-updates on new builds

## Current Task

**STATUS**: Phase 7 complete (70% done). Ready to start **Phase 8 - Dashboard & Settings**.

The app is fully functional for workout and nutrition tracking with offline support. User can now register, login, and use all features. Next step is to build the dashboard for at-a-glance summaries and settings page for user preferences.

## How to Continue

1. Verify both services are running:
   - Backend: `curl http://192.168.1.44:8000/health`
   - Frontend: Open http://192.168.1.44:5173

2. If services are down, restart them:
   ```bash
   # Backend
   ssh patrick@192.168.1.44
   cd HealthApp/backend
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000 &

   # Frontend
   cd ../frontend
   npm run preview -- --host --port 5173 &
   ```

3. Proceed with Phase 8 implementation as described above

## Files to Reference

- **Plan**: `PLAN.md` (full 10-phase plan)
- **Phase 1 Complete**: `PHASE1_COMPLETE.md`
- **Phase 2 Complete**: `PHASE2_COMPLETE.md`
- **Phase 3 Complete**: `PHASE3_COMPLETE.md`
- **Phase 4 Complete**: `PHASE4_COMPLETE.md`
- **Phase 5 Complete**: `PHASE5_COMPLETE.md`
- **Phase 6 Complete**: `PHASE6_COMPLETE.md`
- **Phase 7 Complete**: `PHASE7_COMPLETE.md`

Each completion document contains detailed information about what was built, how it works, and testing procedures.

---

**Ready to continue with Phase 8!** 🚀
