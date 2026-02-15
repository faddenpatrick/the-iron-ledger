"""Exercise and workout template schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from uuid import UUID
from datetime import datetime

# Type alias
WorkoutType = Literal['lifting', 'cardio']


class ExerciseBase(BaseModel):
    """Base exercise schema."""
    name: str = Field(..., max_length=255)
    muscle_group: Optional[str] = Field(None, max_length=100)
    equipment: Optional[str] = Field(None, max_length=100)


class ExerciseCreate(ExerciseBase):
    """Create exercise request."""
    pass


class ExerciseUpdate(ExerciseBase):
    """Update exercise request."""
    name: Optional[str] = Field(None, max_length=255)


class ExerciseResponse(ExerciseBase):
    """Exercise response."""
    id: UUID
    is_custom: bool
    user_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateExerciseBase(BaseModel):
    """Base template exercise schema."""
    exercise_id: UUID
    order_index: int
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None
    target_weight: Optional[float] = None
    notes: Optional[str] = None


class TemplateExerciseCreate(TemplateExerciseBase):
    """Create template exercise request."""
    pass


class TemplateExerciseResponse(TemplateExerciseBase):
    """Template exercise response with exercise details."""
    id: UUID
    exercise: ExerciseResponse

    class Config:
        from_attributes = True


class WorkoutTemplateBase(BaseModel):
    """Base workout template schema."""
    name: str = Field(..., max_length=255)
    workout_type: WorkoutType = 'lifting'


class WorkoutTemplateCreate(WorkoutTemplateBase):
    """Create workout template request."""
    exercises: List[TemplateExerciseCreate] = []


class WorkoutTemplateUpdate(BaseModel):
    """Update workout template request."""
    name: Optional[str] = Field(None, max_length=255)
    workout_type: Optional[WorkoutType] = None
    exercises: Optional[List[TemplateExerciseCreate]] = None


class WorkoutTemplateResponse(WorkoutTemplateBase):
    """Workout template response."""
    id: UUID
    user_id: UUID
    workout_type: WorkoutType
    created_at: datetime
    updated_at: datetime
    exercises: List[TemplateExerciseResponse] = []

    class Config:
        from_attributes = True


class WorkoutTemplateListResponse(WorkoutTemplateBase):
    """Workout template list response (without exercises)."""
    id: UUID
    user_id: UUID
    workout_type: WorkoutType
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
