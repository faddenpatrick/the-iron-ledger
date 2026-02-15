"""Workout session and set schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date


class SetBase(BaseModel):
    """Base set schema."""
    exercise_id: UUID
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = Field(None, ge=1, le=10)


class SetCreate(SetBase):
    """Create set request."""
    pass


class SetUpdate(BaseModel):
    """Update set request."""
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = Field(None, ge=1, le=10)


class SetResponse(SetBase):
    """Set response."""
    id: UUID
    workout_id: UUID
    exercise_name_snapshot: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    """Base workout schema."""
    workout_date: date
    started_at: datetime


class WorkoutCreate(WorkoutBase):
    """Create workout request."""
    template_id: Optional[UUID] = None


class WorkoutResponse(WorkoutBase):
    """Workout response."""
    id: UUID
    user_id: UUID
    template_id: Optional[UUID]
    template_name_snapshot: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    sets: List[SetResponse] = []

    class Config:
        from_attributes = True


class WorkoutListResponse(WorkoutBase):
    """Workout list response (without sets)."""
    id: UUID
    user_id: UUID
    template_id: Optional[UUID]
    template_name_snapshot: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutCompleteRequest(BaseModel):
    """Complete workout request."""
    completed_at: datetime


class SaveAsTemplateRequest(BaseModel):
    """Save workout as template request."""
    template_name: str = Field(..., max_length=255)
