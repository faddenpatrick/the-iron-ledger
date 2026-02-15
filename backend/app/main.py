"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.v1 import auth, exercises, workouts, nutrition, settings as settings_router, openfoodfacts
from .database import SessionLocal
from scripts.seed_exercises import seed_exercises

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(exercises.router, prefix="/api/v1/exercises", tags=["Exercises"])
app.include_router(workouts.router, prefix="/api/v1/workouts", tags=["Workouts"])
app.include_router(nutrition.router, prefix="/api/v1/nutrition", tags=["Nutrition"])
app.include_router(settings_router.router, prefix="/api/v1/user", tags=["User Settings"])
app.include_router(openfoodfacts.router, prefix="/api/v1/openfoodfacts", tags=["Open Food Facts"])


@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "HealthApp API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    db = SessionLocal()
    try:
        seed_exercises(db)
    except Exception as e:
        print(f"Error during startup: {e}")
    finally:
        db.close()
