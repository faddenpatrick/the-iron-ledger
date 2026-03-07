"""Admin dashboard schemas."""
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date


class AdminOverviewResponse(BaseModel):
    """High-level platform metrics."""
    total_users: int
    users_active_last_7_days: int
    users_active_last_30_days: int
    total_workouts_completed: int
    total_meals_logged: int
    total_sets_logged: int
    avg_workouts_per_active_user: Optional[float] = None


class UserGrowthPoint(BaseModel):
    """Single data point for user growth chart."""
    date: date
    total_users: int
    new_users: int


class UserGrowthResponse(BaseModel):
    """User registration trend over time."""
    data_points: List[UserGrowthPoint]


class UserDetailRow(BaseModel):
    """User summary for admin user list."""
    email: str
    created_at: date
    last_active: Optional[date] = None
    total_workouts: int
    total_meals: int
    coach_type: Optional[str] = None
    has_macro_targets: bool


class UserListResponse(BaseModel):
    """List of all users with activity summaries."""
    users: List[UserDetailRow]
    total: int


class FeatureAdoptionResponse(BaseModel):
    """Feature usage metrics across all users."""
    users_with_templates: int
    users_with_custom_exercises: int
    users_with_meals: int
    users_with_macro_targets: int
    users_with_supplements: int
    users_with_measurements: int
    coach_type_breakdown: Dict[str, int]
