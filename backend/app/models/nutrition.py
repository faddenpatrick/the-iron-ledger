"""Nutrition tracking models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Date, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class MealCategory(Base):
    """User-defined meal categories (e.g., Breakfast, Lunch, Snack)."""

    __tablename__ = "meal_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="meal_categories")
    meals = relationship("Meal", back_populates="category")


class Food(Base):
    """Food database (system and custom)."""

    __tablename__ = "foods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    serving_size = Column(String(100), nullable=False)  # e.g., "1 cup", "100g", "1 medium"

    # Macros per serving
    calories = Column(Integer, nullable=False)
    protein = Column(Integer, nullable=False)  # grams
    carbs = Column(Integer, nullable=False)  # grams
    fat = Column(Integer, nullable=False)  # grams

    is_custom = Column(Boolean, default=False, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # null for system foods

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="foods")
    meal_items = relationship("MealItem", back_populates="food")


class Meal(Base):
    """Meal logging session."""

    __tablename__ = "meals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("meal_categories.id", ondelete="CASCADE"), nullable=False)

    # Snapshot of category name (preserves history if category renamed/deleted)
    category_name_snapshot = Column(String(100), nullable=False)

    meal_date = Column(Date, nullable=False, index=True)
    meal_time = Column(DateTime(timezone=True), nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="meals")
    category = relationship("MealCategory", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    """Foods within a meal (with macro snapshots)."""

    __tablename__ = "meal_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_id = Column(UUID(as_uuid=True), ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(UUID(as_uuid=True), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)

    # Snapshots (preserve historical accuracy if food macros change)
    food_name_snapshot = Column(String(255), nullable=False)
    calories_snapshot = Column(Integer, nullable=False)  # Total for this item (servings * food.calories)
    protein_snapshot = Column(Integer, nullable=False)
    carbs_snapshot = Column(Integer, nullable=False)
    fat_snapshot = Column(Integer, nullable=False)

    servings = Column(Float, nullable=False)  # Number of servings (e.g., 1.5, 2)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    meal = relationship("Meal", back_populates="items")
    food = relationship("Food", back_populates="meal_items")
