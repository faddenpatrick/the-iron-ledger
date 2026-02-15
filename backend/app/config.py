"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "HealthApp API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://healthapp_user:healthapp_pass@localhost:5432/healthapp"

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://192.168.1.44:5173",
        "http://192.168.1.44:4173",
        "http://192.168.1.44:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
