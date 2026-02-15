"""Workout session and set tracking models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class Workout(Base):
    """Actual workout session."""

    __tablename__ = "workouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)

    # Snapshot of template name (preserves history if template renamed/deleted)
    template_name_snapshot = Column(String(255), nullable=True)

    workout_type = Column(String(20), nullable=False, default='lifting', index=True)  # 'lifting' or 'cardio'
    workout_date = Column(Date, nullable=False, index=True)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relationships
    user = relationship("User", back_populates="workouts")
    template = relationship("WorkoutTemplate", back_populates="workouts")
    sets = relationship("Set", back_populates="workout", cascade="all, delete-orphan", order_by="Set.created_at")


class Set(Base):
    """Individual exercise set within a workout."""

    __tablename__ = "sets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workout_id = Column(UUID(as_uuid=True), ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)

    # Snapshot of exercise name (preserves history if exercise renamed/deleted)
    exercise_name_snapshot = Column(String(255), nullable=False)

    set_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    set_type = Column(String(20), nullable=False, default='normal')  # 'warmup', 'normal', 'drop_set', 'failure'
    weight = Column(Float, nullable=True)  # Weight used
    reps = Column(Integer, nullable=True)  # Reps completed
    rpe = Column(Float, nullable=True)  # Rate of Perceived Exertion (1-10)

    # Set completion tracking
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    workout = relationship("Workout", back_populates="sets")
    exercise = relationship("Exercise", back_populates="sets")
