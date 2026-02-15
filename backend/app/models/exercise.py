"""Exercise and workout template models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class Exercise(Base):
    """Exercise database (system and custom)."""

    __tablename__ = "exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    muscle_group = Column(String(100), nullable=True)  # e.g., "Chest", "Legs", "Back"
    equipment = Column(String(100), nullable=True)  # e.g., "Barbell", "Dumbbell", "Bodyweight"
    is_custom = Column(Boolean, default=False, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # null for system exercises

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="exercises")
    template_exercises = relationship("TemplateExercise", back_populates="exercise")
    sets = relationship("Set", back_populates="exercise")


class WorkoutTemplate(Base):
    """User-created workout plans."""

    __tablename__ = "workout_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    workout_type = Column(String(20), nullable=False, default='lifting', index=True)  # 'lifting' or 'cardio'

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="workout_templates")
    exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan", order_by="TemplateExercise.order_index")
    workouts = relationship("Workout", back_populates="template")


class TemplateExercise(Base):
    """Exercises within a workout template."""

    __tablename__ = "template_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)

    order_index = Column(Integer, nullable=False)  # Order in template
    target_sets = Column(Integer, nullable=True)
    target_reps = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    template = relationship("WorkoutTemplate", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="template_exercises")
