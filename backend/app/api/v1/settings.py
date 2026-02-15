"""User settings API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ...database import get_db
from ...models.user import User, UserSettings
from ..deps import get_current_user
from pydantic import BaseModel


router = APIRouter()


class UserSettingsResponse(BaseModel):
    """User settings response schema."""
    theme: str
    units: str
    default_rest_timer: int
    macro_target_calories: Optional[int]
    macro_target_protein: Optional[int]
    macro_target_carbs: Optional[int]
    macro_target_fat: Optional[int]

    class Config:
        from_attributes = True


class UpdateUserSettingsRequest(BaseModel):
    """Update user settings request schema."""
    theme: Optional[str] = None
    units: Optional[str] = None
    default_rest_timer: Optional[int] = None
    macro_target_calories: Optional[int] = None
    macro_target_protein: Optional[int] = None
    macro_target_carbs: Optional[int] = None
    macro_target_fat: Optional[int] = None


@router.get("/settings", response_model=UserSettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's settings."""
    # Get or create settings for user
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        # Create default settings
        settings = UserSettings(
            user_id=current_user.id,
            theme="dark",
            units="lbs",
            default_rest_timer=90,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/settings", response_model=UserSettingsResponse)
def update_user_settings(
    request: UpdateUserSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's settings."""
    # Get or create settings
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    # Update provided fields
    if request.theme is not None:
        if request.theme not in ["dark", "light"]:
            raise HTTPException(status_code=400, detail="Theme must be 'dark' or 'light'")
        settings.theme = request.theme

    if request.units is not None:
        if request.units not in ["lbs", "kg"]:
            raise HTTPException(status_code=400, detail="Units must be 'lbs' or 'kg'")
        settings.units = request.units

    if request.default_rest_timer is not None:
        if request.default_rest_timer < 0 or request.default_rest_timer > 600:
            raise HTTPException(status_code=400, detail="Rest timer must be between 0 and 600 seconds")
        settings.default_rest_timer = request.default_rest_timer

    if request.macro_target_calories is not None:
        settings.macro_target_calories = request.macro_target_calories if request.macro_target_calories > 0 else None

    if request.macro_target_protein is not None:
        settings.macro_target_protein = request.macro_target_protein if request.macro_target_protein > 0 else None

    if request.macro_target_carbs is not None:
        settings.macro_target_carbs = request.macro_target_carbs if request.macro_target_carbs > 0 else None

    if request.macro_target_fat is not None:
        settings.macro_target_fat = request.macro_target_fat if request.macro_target_fat > 0 else None

    db.commit()
    db.refresh(settings)

    return settings
