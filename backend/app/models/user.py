"""User models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    """User authentication and profile."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="user", cascade="all, delete-orphan")
    workout_templates = relationship("WorkoutTemplate", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    meal_categories = relationship("MealCategory", back_populates="user", cascade="all, delete-orphan")
    foods = relationship("Food", back_populates="user", cascade="all, delete-orphan")
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    """User preferences and macro targets."""

    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Preferences
    theme = Column(String(20), default="dark", nullable=False)  # 'dark' or 'light'
    units = Column(String(10), default="lbs", nullable=False)  # 'lbs' or 'kg'
    default_rest_timer = Column(Integer, default=90, nullable=False)  # seconds

    # Macro targets
    macro_target_calories = Column(Integer, nullable=True)
    macro_target_protein = Column(Integer, nullable=True)  # grams
    macro_target_carbs = Column(Integer, nullable=True)  # grams
    macro_target_fat = Column(Integer, nullable=True)  # grams

    # Macro percentage mode
    macro_input_mode = Column(String(20), default="grams", nullable=False)  # 'grams' or 'percentage'
    macro_percentage_protein = Column(Integer, nullable=True)  # 0-100
    macro_percentage_carbs = Column(Integer, nullable=True)  # 0-100
    macro_percentage_fat = Column(Integer, nullable=True)  # 0-100

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="settings")
