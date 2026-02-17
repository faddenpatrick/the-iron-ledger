# The Iron Ledger - Workout & Nutrition Tracker PWA

**Your personal workout and nutrition ledger. Track your gains with the strength of iron, even when you're offline.**

A self-hosted Progressive Web App for tracking workouts and nutrition with complete offline functionality.

## 🚀 Features

- **Offline-First Architecture**: Works seamlessly without internet, syncs when connected
- **Workout Tracking**: Create templates, log sets with weight/reps/RPE, save freestyle workouts
- **Nutrition Tracking**: Custom meal categories, food database, macro tracking with daily summaries
- **Home Gym Focused**: Pre-loaded with 100+ exercises (barbell, dumbbell, kettlebell, bodyweight)
- **Mobile-First UI**: One-handed operation, thumb-friendly zones, swipe gestures
- **Data Integrity**: Snapshot strategy preserves historical accuracy when editing base data
- **JWT Authentication**: Secure token-based auth with automatic refresh

## 📋 Technology Stack

### Backend
- **FastAPI** (Python) - High-performance async API framework
- **PostgreSQL 16** - Relational database with UUID primary keys
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **JWT** - Token-based authentication

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **Dexie** - IndexedDB wrapper for offline storage
- **vite-plugin-pwa** - Progressive Web App with service worker

### Deployment
- **Docker** + **Docker Compose** - Containerization
- **Nginx** - Frontend reverse proxy (built into frontend container)

## 📦 Project Structure

```
HealthApp/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Environment configuration
│   │   ├── database.py      # SQLAlchemy session management
│   │   ├── models/          # ORM models (11 tables)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── api/v1/          # API endpoints (auth, exercises, workouts, nutrition)
│   │   ├── core/            # Security (JWT, password hashing)
│   │   └── migrations/      # Alembic database migrations
│   ├── scripts/
│   │   └── seed_exercises.py  # Seed 100+ home gym exercises
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/                # React PWA
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── App.tsx         # Routing and auth
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context (Auth)
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml       # PostgreSQL service
├── .env.example            # Environment template
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Git
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)

### 1. Clone Repository

```bash
git clone <repository-url>
cd HealthApp
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update:
# - SECRET_KEY (generate a long random string)
# - DATABASE_URL (if not using Docker)
# - CORS_ORIGINS (add your frontend URLs)
```

### 3. Start PostgreSQL Database

```bash
docker-compose up -d postgres
```

Wait for PostgreSQL to be healthy (~10 seconds):

```bash
docker-compose ps
```

### 4. Set Up Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed exercises
python scripts/seed_exercises.py

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`
- API Docs (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 5. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token

### Exercises
- `GET /api/v1/exercises` - List exercises (system + custom)
- `POST /api/v1/exercises` - Create custom exercise
- `PUT /api/v1/exercises/{id}` - Update custom exercise
- `DELETE /api/v1/exercises/{id}` - Delete custom exercise

### Workout Templates
- `GET /api/v1/workouts/templates` - List user templates
- `POST /api/v1/workouts/templates` - Create template
- `GET /api/v1/workouts/templates/{id}` - Get template details
- `PUT /api/v1/workouts/templates/{id}` - Update template
- `DELETE /api/v1/workouts/templates/{id}` - Delete template

### Workouts
- `POST /api/v1/workouts` - Start workout session
- `GET /api/v1/workouts` - List workouts (with date filters)
- `GET /api/v1/workouts/{id}` - Get workout details
- `POST /api/v1/workouts/{id}/complete` - Mark workout complete
- `POST /api/v1/workouts/{id}/save-as-template` - Save freestyle workout as template
- `POST /api/v1/workouts/{id}/sets` - Add set to workout
- `PUT /api/v1/workouts/{id}/sets/{set_id}` - Update set
- `DELETE /api/v1/workouts/{id}/sets/{set_id}` - Delete set

### Nutrition
- `GET /api/v1/nutrition/meal-categories` - List meal categories
- `POST /api/v1/nutrition/meal-categories` - Create meal category
- `PUT /api/v1/nutrition/meal-categories/{id}` - Update meal category
- `DELETE /api/v1/nutrition/meal-categories/{id}` - Delete meal category
- `GET /api/v1/nutrition/foods` - List foods (system + custom)
- `POST /api/v1/nutrition/foods` - Create custom food
- `PUT /api/v1/nutrition/foods/{id}` - Update custom food
- `DELETE /api/v1/nutrition/foods/{id}` - Delete custom food
- `POST /api/v1/nutrition/meals` - Create meal with items
- `GET /api/v1/nutrition/meals` - List meals (with date filters)
- `GET /api/v1/nutrition/meals/{id}` - Get meal details
- `DELETE /api/v1/nutrition/meals/{id}` - Delete meal
- `POST /api/v1/nutrition/meals/{id}/items` - Add item to existing meal
- `POST /api/v1/nutrition/meals/{id}/copy` - Copy meal to new date/time
- `PATCH /api/v1/nutrition/meal-items/{id}` - Update meal item servings
- `DELETE /api/v1/nutrition/meal-items/{id}` - Delete meal item
- `GET /api/v1/nutrition/summary?summary_date=YYYY-MM-DD` - Daily nutrition summary
- `GET /api/v1/nutrition/weekly-average?end_date=YYYY-MM-DD` - 7-day running average

### OpenFoodFacts Integration
- `GET /api/v1/openfoodfacts/search?q={query}` - Search external food database
- `GET /api/v1/openfoodfacts/barcode/{barcode}` - Lookup food by barcode

## 🗄️ Database Schema

11 tables with UUID primary keys for offline sync:

1. **users** - Authentication and profile
2. **user_settings** - Preferences and macro targets
3. **exercises** - Exercise database (system + custom)
4. **workout_templates** - User workout plans
5. **template_exercises** - Exercises in templates
6. **workouts** - Actual workout sessions with template name snapshots
7. **sets** - Individual exercise sets with exercise name snapshots
8. **meal_categories** - User-defined meal categories
9. **foods** - Food database (system + custom)
10. **meals** - Meal logging sessions with category name snapshots
11. **meal_items** - Foods in meals with macro snapshots

### Snapshot Strategy

Historical data integrity is preserved through snapshots:
- **Workouts** store template name snapshot
- **Sets** store exercise name snapshot
- **Meals** store category name snapshot
- **Meal Items** store food name and complete macro snapshots (calories, protein, carbs, fat)

This ensures workout and nutrition history remains accurate even if templates, exercises, categories, or foods are renamed or deleted.

## 🚢 Deployment

The app runs on a Linux server (ilobster) at `192.168.1.44` using Docker Compose.

### Deploy Updates

```bash
# From local machine: commit and push
git add . && git commit -m "your message" && git push

# SSH into server and deploy
ssh patrick@192.168.1.44
cd ~/the-iron-ledger
git pull
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Access

- Frontend: `http://192.168.1.44`
- Backend API: `http://192.168.1.44:8000`
- API Docs: `http://192.168.1.44:8000/docs`

## ✅ Implementation Status

- ✅ **Phase 1**: Database & Backend Core — PostgreSQL, Alembic, JWT auth, 100+ exercises seeded
- ✅ **Phase 2**: Workout Backend API — Exercise CRUD, templates, session logging, set tracking with snapshots
- ✅ **Phase 3**: Nutrition Backend API — Meal categories, food database, meal logging, macro snapshots, daily/weekly summaries
- ✅ **Phase 4**: React Frontend Foundation — Vite + React + TypeScript, Tailwind, JWT auth flow, routing
- ✅ **Phase 5**: Workout Tracking Frontend UI — Exercise selector, template builder, workout logger, set rows, rest timer
- ✅ **Phase 6**: Nutrition Tracking Frontend UI — Meal logger, food search, OpenFoodFacts integration, barcode scanning, portion input, macro summaries, tap-to-edit servings
- ✅ **Phase 7**: PWA & Offline Support — IndexedDB with Dexie, service worker, offline-first data access
- ✅ **Phase 8**: Dashboard & Settings — Macro targets, unit preferences, PWA install prompt
- ✅ **Phase 9**: Docker & Deployment — Multi-container Docker Compose (PostgreSQL, FastAPI, React/Nginx), auto-migrations on startup

## 🧪 Testing

### Backend API Testing

```bash
# Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get exercises (replace TOKEN with access_token from login)
curl http://localhost:8000/api/v1/exercises \
  -H "Authorization: Bearer TOKEN"
```

### Database Verification

```bash
# Connect to database
docker exec -it healthapp_db psql -U healthapp_user -d healthapp

# Check tables
\dt

# Count exercises
SELECT COUNT(*) FROM exercises WHERE is_custom = false;

# View user
SELECT id, email, created_at FROM users;
```

## 🔧 Troubleshooting

### Containers won't start
- Check status: `docker compose -f docker-compose.prod.yml ps`
- View logs: `docker compose -f docker-compose.prod.yml logs -f`
- Rebuild: `docker compose -f docker-compose.prod.yml build --no-cache`

### Frontend can't connect to API
- Verify `VITE_API_URL` in `.env` matches the backend address
- Check CORS_ORIGINS in `.env` includes the frontend URL
- Backend logs: `docker compose -f docker-compose.prod.yml logs backend`

### Database issues
- Shell into DB: `docker compose -f docker-compose.prod.yml exec db psql -U healthapp_user -d healthapp`
- Migrations run automatically on backend container startup via `docker-entrypoint.sh`

## 📝 Notes

- Default theme: Dark mode
- Default units: lbs (configurable in Settings)
- Default rest timer: 90 seconds
- All timestamps stored in UTC
- Soft deletes for sync reconciliation

## 🎯 Future Work

- Jellyfin integration for media streaming
- Automated testing (backend + frontend)
- HTTPS via Tailscale Serve or reverse proxy
- Nextcloud integration for file sync

## 📄 License

Private project for personal use.
