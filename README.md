# The Iron Ledger - Workout & Nutrition Tracker PWA

**Your personal workout and nutrition ledger. Track your gains with the strength of iron, even when you're offline.**

A self-hosted Progressive Web App for tracking workouts and nutrition with complete offline functionality.

## Features

- **Offline-First Architecture**: Works seamlessly without internet, syncs when connected
- **Workout Tracking**: Create templates, log sets with weight/reps/RPE, save freestyle workouts
- **Nutrition Tracking**: Custom meal categories, food database, macro tracking with daily and weekly summaries
- **Supplement Tracking**: Log daily supplement intake with brand, dosage, and notes
- **Body Measurements**: Track body weight over time with daily entries
- **AI Coach**: Personalized coaching insights powered by Google Gemini with selectable coach personas
- **Cheat Day Toggle**: Mark cheat days to exclude them from weekly macro averages
- **Home Gym Focused**: Pre-loaded with 100+ exercises (barbell, dumbbell, kettlebell, bodyweight)
- **Mobile-First UI**: One-handed operation, thumb-friendly zones, swipe gestures
- **Barcode Scanner**: Scan food barcodes via OpenFoodFacts integration
- **Data Integrity**: Snapshot strategy preserves historical accuracy when editing base data
- **JWT Authentication**: Secure token-based auth with automatic refresh
- **Registration Gating**: Optional registration code to control new user sign-ups
- **Admin Dashboard**: Platform metrics, user growth charts, and feature adoption stats

## Technology Stack

### Backend
- **FastAPI** (Python) - High-performance async API framework
- **PostgreSQL 16** - Relational database with UUID primary keys
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **JWT** (python-jose) - Token-based authentication
- **Google Gemini** (google-genai) - AI coaching insights

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **Dexie 4** - IndexedDB wrapper for offline storage
- **vite-plugin-pwa** - Progressive Web App with Workbox service worker
- **html5-qrcode** - Barcode scanning
- **date-fns** - Date utilities

### Deployment
- **Docker** + **Docker Compose** - Containerization
- **Nginx** - Reverse proxy (optional profile for production with domain/SSL)
- **GitHub Actions** - CI/CD pipeline builds and pushes images to GHCR
- **Watchtower** - Automatic container updates from GHCR

## Project Structure

```
the-iron-ledger/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py          # FastAPI entry point, router registration
│   │   ├── config.py        # Pydantic settings from environment
│   │   ├── database.py      # SQLAlchemy session management
│   │   ├── models/          # ORM models (16 tables)
│   │   │   ├── user.py      # User, UserSettings, CoachInsight, BodyMeasurement
│   │   │   ├── exercise.py  # Exercise, WorkoutTemplate, TemplateExercise
│   │   │   ├── workout.py   # Workout, Set
│   │   │   ├── nutrition.py # MealCategory, Food, Meal, MealItem, CheatDay
│   │   │   └── supplement.py# Supplement, SupplementLog
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── api/v1/          # API route handlers
│   │   │   ├── auth.py      # Register, login, token refresh
│   │   │   ├── exercises.py # Exercise CRUD
│   │   │   ├── workouts.py  # Templates, sessions, sets
│   │   │   ├── nutrition.py # Meals, foods, categories, cheat days
│   │   │   ├── settings.py  # User preferences, macro targets
│   │   │   ├── openfoodfacts.py # External food database proxy
│   │   │   ├── coaching.py  # AI coach insights
│   │   │   ├── supplements.py # Supplement CRUD and logging
│   │   │   ├── measurements.py # Body weight tracking
│   │   │   └── admin.py     # Admin metrics and user management
│   │   └── core/
│   │       ├── security.py  # JWT, bcrypt password hashing
│   │       └── coach_personas.py # AI coach personality definitions
│   ├── scripts/
│   │   └── seed_exercises.py  # Seed 100+ home gym exercises
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/                # React PWA
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── App.tsx         # Routing with protected/public/admin routes
│   │   ├── pages/          # Page components (7)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── WorkoutPage.tsx
│   │   │   ├── NutritionPage.tsx
│   │   │   ├── CoachingPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── components/
│   │   │   └── features/   # Feature components by domain
│   │   │       ├── dashboard/  # 4 components
│   │   │       ├── workout/    # 11 components
│   │   │       ├── nutrition/  # 16 components
│   │   │       └── layout/     # 2 components (BottomNav, Header)
│   │   ├── context/        # AuthContext, SyncContext
│   │   ├── services/       # API clients and offline services (10 files)
│   │   ├── hooks/          # Custom hooks (6)
│   │   ├── types/          # TypeScript interfaces (9 files)
│   │   └── utils/          # Macro calculations, UUID generation
│   ├── package.json
│   └── vite.config.ts
│
├── nginx/                   # Nginx reverse proxy config
├── docker-compose.yml       # Dev: PostgreSQL only
├── docker-compose.prod.yml  # Prod: DB + Backend + Frontend + optional Nginx
├── Makefile                 # Docker/deployment commands
├── .env.example            # Environment template
└── .github/workflows/
    └── deploy.yml          # CI/CD: build and push to GHCR
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Git
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)

### 1. Clone Repository

```bash
git clone <repository-url>
cd the-iron-ledger
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update:
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - DATABASE_PASSWORD
# - CORS_ORIGINS (add your frontend URLs)
# - VITE_API_URL (your backend URL)
# - REGISTRATION_CODE (optional, leave empty for open registration)
# - GEMINI_API_KEY (optional, for AI coaching features)
```

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

Wait for PostgreSQL to be healthy (~10 seconds):

```bash
docker compose ps
```

### 4. Set Up Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server (exercises are auto-seeded on startup)
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

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user (optional registration code)
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

### Supplements
- `GET /api/v1/supplements` - List user supplements
- `POST /api/v1/supplements` - Create supplement
- `PUT /api/v1/supplements/{id}` - Update supplement
- `DELETE /api/v1/supplements/{id}` - Delete supplement
- `POST /api/v1/supplements/{id}/log` - Log supplement intake
- `GET /api/v1/supplements/logs?date=YYYY-MM-DD` - Get logs for a date

### Body Measurements
- `POST /api/v1/measurements` - Log body measurement
- `GET /api/v1/measurements` - List measurements (with date range)

### AI Coaching
- `GET /api/v1/coaching/daily` - Get daily AI coaching insight

### OpenFoodFacts Integration
- `GET /api/v1/openfoodfacts/search?q={query}` - Search external food database
- `GET /api/v1/openfoodfacts/barcode/{barcode}` - Lookup food by barcode

### User Settings
- `GET /api/v1/user/settings` - Get user preferences
- `PUT /api/v1/user/settings` - Update preferences and macro targets

### Admin (requires admin role)
- `GET /api/v1/admin/overview` - Platform metrics
- `GET /api/v1/admin/user-growth` - User growth data
- `GET /api/v1/admin/users` - User list with details
- `GET /api/v1/admin/feature-adoption` - Feature usage stats

## Database Schema

16 tables with UUID primary keys for offline sync:

1. **users** - Authentication and profile (includes admin flag)
2. **user_settings** - Preferences, macro targets, coach type selection
3. **coach_insights** - Cached AI coaching insights (one per user per day per section)
4. **body_measurements** - Daily body weight tracking
5. **exercises** - Exercise database (system + custom per user)
6. **workout_templates** - User workout plans
7. **template_exercises** - Exercises in templates with order and targets
8. **workouts** - Actual workout sessions with template name snapshots
9. **sets** - Individual exercise sets with exercise name snapshots
10. **meal_categories** - User-defined meal categories
11. **foods** - Food database (system + custom per user)
12. **meals** - Meal logging sessions with category name snapshots
13. **meal_items** - Foods in meals with macro snapshots
14. **cheat_days** - Cheat day markers (one per user per date)
15. **supplements** - User supplement definitions (name, brand, dosage)
16. **supplement_logs** - Daily supplement intake tracking

### Snapshot Strategy

Historical data integrity is preserved through snapshots:
- **Workouts** store template name snapshot
- **Sets** store exercise name snapshot
- **Meals** store category name snapshot
- **Meal Items** store food name and complete macro snapshots (calories, protein, carbs, fat)

This ensures workout and nutrition history remains accurate even if templates, exercises, categories, or foods are renamed or deleted.

## Docker Commands (Makefile)

### Development
```bash
make build           # Build Docker images
make up              # Start all services
make down            # Stop services
make restart         # Restart services
make logs            # View all logs (follow mode)
make logs-backend    # Backend logs only
make logs-frontend   # Frontend logs only
make logs-db         # Database logs only
make ps              # Show running containers
```

### Database
```bash
make db-shell        # Open PostgreSQL shell
make db-backup       # Backup database to backups/
make db-restore FILE=backups/file.sql  # Restore from backup
```

### Deployment
```bash
make deploy          # Full deployment (pull, build, restart)
make clean           # Remove containers and volumes (with confirmation)
```

## Deployment

### CI/CD Pipeline

GitHub Actions (`.github/workflows/deploy.yml`) triggers on push to `main`:
1. Builds backend and frontend Docker images
2. Pushes to GitHub Container Registry (GHCR) with `latest` and SHA tags
3. Watchtower on the production server auto-pulls and restarts updated containers

### Production Stack

The production deployment runs via `docker-compose.prod.yml`:
- **PostgreSQL 16** - Database
- **Backend** - FastAPI (GHCR image, Watchtower-enabled)
- **Frontend** - React/Nginx (GHCR image, Watchtower-enabled)
- **Nginx** - Optional reverse proxy profile for domain/SSL (`--profile with-nginx`)

### Access

- Frontend: `https://ironledger.housefadden.com`
- API Docs: `https://ironledger.housefadden.com/docs`

## Frontend Routing

| Route | Page | Access |
|-------|------|--------|
| `/login` | LoginPage | Public only |
| `/` | Dashboard | Authenticated |
| `/workout` | WorkoutPage | Authenticated |
| `/nutrition` | NutritionPage | Authenticated |
| `/coaching` | CoachingPage | Authenticated |
| `/settings` | SettingsPage | Authenticated |
| `/admin` | AdminPage | Admin only |

## Testing

No automated test suite exists currently. Manual testing is done via:
- Swagger UI at `/docs` for backend API testing
- Frontend at `http://localhost:5173` for UI testing

### Quick API Test

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
make db-shell

# Check tables
\dt

# Count exercises
SELECT COUNT(*) FROM exercises WHERE is_custom = false;

# View users
SELECT id, email, created_at FROM users;
```

## Troubleshooting

### Containers won't start
- Check status: `make ps`
- View logs: `make logs`
- Rebuild: `docker compose -f docker-compose.prod.yml build --no-cache`

### Frontend can't connect to API
- Verify `VITE_API_URL` in `.env` matches the backend address
- Check `CORS_ORIGINS` in `.env` includes the frontend URL
- Backend logs: `make logs-backend`

### Database issues
- Shell into DB: `make db-shell`
- Migrations run automatically on backend container startup via `docker-entrypoint.sh`

## Notes

- Default theme: Dark mode
- Default units: lbs (configurable in Settings)
- Default rest timer: 90 seconds
- All timestamps stored in UTC
- Soft deletes for sync reconciliation
- Exercises are auto-seeded on backend startup
- AI coaching requires a `GEMINI_API_KEY` environment variable

## Future Work

- Automated testing (backend + frontend)
- HTTPS via Tailscale Serve or reverse proxy
- Cardio workout support (placeholder exists)
- Progress charts and trend visualization

## License

Private project for personal use.
