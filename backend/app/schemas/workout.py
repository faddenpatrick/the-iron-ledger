"""Workout session and set schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from uuid import UUID
from datetime import datetime, date

# Type aliases
SetType = Literal['warmup', 'normal', 'drop_set', 'failure']
WorkoutType = Literal['lifting', 'cardio']


class SetBase(BaseModel):
    """Base set schema."""
    exercise_id: UUID
    set_number: int
    set_type: SetType = 'normal'
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = Field(None, ge=1, le=10)


class SetCreate(SetBase):
    """Create set request."""
    pass


class SetUpdate(BaseModel):
    """Update set request."""
    set_type: Optional[SetType] = None
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = Field(None, ge=1, le=10)
    is_completed: Optional[bool] = None


class SetResponse(SetBase):
    """Set response."""
    id: UUID
    workout_id: UUID
    exercise_name_snapshot: str
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    """Base workout schema."""
    workout_date: date
    started_at: datetime
    workout_type: WorkoutType = 'lifting'


class WorkoutCreate(WorkoutBase):
    """Create workout request."""
    template_id: Optional[UUID] = None


class WorkoutResponse(WorkoutBase):
    """Workout response."""
    id: UUID
    user_id: UUID
    template_id: Optional[UUID]
    template_name_snapshot: Optional[str]
    workout_type: WorkoutType
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
    workout_type: WorkoutType
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


class PreviousSetData(BaseModel):
    """Previous set data for comparison."""
    set_number: int
    weight: Optional[float]
    reps: Optional[int]
    rpe: Optional[float]


class PreviousPerformanceResponse(BaseModel):
    """Previous performance for an exercise."""
    exercise_id: UUID
    has_previous: bool
    previous_workout_date: Optional[date]
    previous_sets: List[PreviousSetData] = []


class WorkoutWeeklyStatsResponse(BaseModel):
    """7-day workout statistics summary."""
    start_date: date
    end_date: date
    workouts_completed: int
    total_volume: float
    total_sets: int
    avg_sets_per_workout: float
    avg_workout_duration_minutes: Optional[float] = None
