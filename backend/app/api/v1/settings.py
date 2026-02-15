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
    macro_input_mode: str
    macro_percentage_protein: Optional[int]
    macro_percentage_carbs: Optional[int]
    macro_percentage_fat: Optional[int]

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
    macro_input_mode: Optional[str] = None
    macro_percentage_protein: Optional[int] = None
    macro_percentage_carbs: Optional[int] = None
    macro_percentage_fat: Optional[int] = None


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

    # Handle macro input mode
    if request.macro_input_mode is not None:
        if request.macro_input_mode not in ["grams", "percentage"]:
            raise HTTPException(status_code=400, detail="Macro input mode must be 'grams' or 'percentage'")
        settings.macro_input_mode = request.macro_input_mode

    # If switching to percentage mode, validate and calculate
    if request.macro_input_mode == "percentage" or (
        settings.macro_input_mode == "percentage" and
        (request.macro_percentage_protein is not None or
         request.macro_percentage_carbs is not None or
         request.macro_percentage_fat is not None or
         request.macro_target_calories is not None)
    ):
        # In percentage mode, calories must be set
        calories = request.macro_target_calories if request.macro_target_calories is not None else settings.macro_target_calories
        if not calories or calories <= 0:
            raise HTTPException(status_code=400, detail="Calories must be set when using percentage mode")

        # Get percentages (use request values if provided, otherwise use existing)
        protein_pct = request.macro_percentage_protein if request.macro_percentage_protein is not None else settings.macro_percentage_protein
        carbs_pct = request.macro_percentage_carbs if request.macro_percentage_carbs is not None else settings.macro_percentage_carbs
        fat_pct = request.macro_percentage_fat if request.macro_percentage_fat is not None else settings.macro_percentage_fat

        # All percentages must be provided
        if protein_pct is None or carbs_pct is None or fat_pct is None:
            raise HTTPException(status_code=400, detail="All macro percentages must be provided in percentage mode")

        # Validate percentage range
        if not (0 <= protein_pct <= 100) or not (0 <= carbs_pct <= 100) or not (0 <= fat_pct <= 100):
            raise HTTPException(status_code=400, detail="Percentages must be between 0 and 100")

        # Validate percentages sum to 100
        total_pct = protein_pct + carbs_pct + fat_pct
        if total_pct != 100:
            raise HTTPException(status_code=400, detail=f"Macro percentages must total 100% (currently {total_pct}%)")

        # Calculate gram values
        # Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
        settings.macro_target_calories = calories
        settings.macro_target_protein = round((calories * protein_pct / 100) / 4)
        settings.macro_target_carbs = round((calories * carbs_pct / 100) / 4)
        settings.macro_target_fat = round((calories * fat_pct / 100) / 9)

        # Store the percentages
        settings.macro_percentage_protein = protein_pct
        settings.macro_percentage_carbs = carbs_pct
        settings.macro_percentage_fat = fat_pct

    # If in grams mode, handle direct updates
    elif request.macro_input_mode == "grams" or settings.macro_input_mode == "grams":
        if request.macro_target_calories is not None:
            settings.macro_target_calories = request.macro_target_calories if request.macro_target_calories > 0 else None

        if request.macro_target_protein is not None:
            settings.macro_target_protein = request.macro_target_protein if request.macro_target_protein > 0 else None

        if request.macro_target_carbs is not None:
            settings.macro_target_carbs = request.macro_target_carbs if request.macro_target_carbs > 0 else None

        if request.macro_target_fat is not None:
            settings.macro_target_fat = request.macro_target_fat if request.macro_target_fat > 0 else None

        # Clear percentages when in grams mode
        settings.macro_percentage_protein = None
        settings.macro_percentage_carbs = None
        settings.macro_percentage_fat = None

    db.commit()
    db.refresh(settings)

    return settings
