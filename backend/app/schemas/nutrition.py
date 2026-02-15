"""Nutrition tracking schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date


class MealCategoryBase(BaseModel):
    """Base meal category schema."""
    name: str = Field(..., max_length=100)
    display_order: int = Field(default=0)


class MealCategoryCreate(MealCategoryBase):
    """Create meal category request."""
    pass


class MealCategoryUpdate(BaseModel):
    """Update meal category request."""
    name: Optional[str] = Field(None, max_length=100)
    display_order: Optional[int] = None


class MealCategoryResponse(MealCategoryBase):
    """Meal category response."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FoodBase(BaseModel):
    """Base food schema."""
    name: str = Field(..., max_length=255)
    serving_size: str = Field(..., max_length=100)
    calories: int = Field(..., ge=0)
    protein: int = Field(..., ge=0)
    carbs: int = Field(..., ge=0)
    fat: int = Field(..., ge=0)


class FoodCreate(FoodBase):
    """Create food request."""
    pass


class FoodUpdate(FoodBase):
    """Update food request."""
    name: Optional[str] = Field(None, max_length=255)
    serving_size: Optional[str] = Field(None, max_length=100)
    calories: Optional[int] = Field(None, ge=0)
    protein: Optional[int] = Field(None, ge=0)
    carbs: Optional[int] = Field(None, ge=0)
    fat: Optional[int] = Field(None, ge=0)


class FoodResponse(FoodBase):
    """Food response."""
    id: UUID
    is_custom: bool
    user_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MealItemBase(BaseModel):
    """Base meal item schema."""
    food_id: UUID
    servings: float = Field(..., gt=0)


class MealItemCreate(MealItemBase):
    """Create meal item request."""
    pass


class MealItemResponse(MealItemBase):
    """Meal item response."""
    id: UUID
    meal_id: UUID
    food_name_snapshot: str
    calories_snapshot: int
    protein_snapshot: int
    carbs_snapshot: int
    fat_snapshot: int
    created_at: datetime

    class Config:
        from_attributes = True


class MealBase(BaseModel):
    """Base meal schema."""
    category_id: UUID
    meal_date: date
    meal_time: datetime


class MealCreate(MealBase):
    """Create meal request."""
    items: List[MealItemCreate] = []


class MealResponse(MealBase):
    """Meal response."""
    id: UUID
    user_id: UUID
    category_name_snapshot: str
    created_at: datetime
    updated_at: datetime
    items: List[MealItemResponse] = []

    class Config:
        from_attributes = True


class MealListResponse(MealBase):
    """Meal list response (without items)."""
    id: UUID
    user_id: UUID
    category_name_snapshot: str
    created_at: datetime

    class Config:
        from_attributes = True


class NutritionSummaryResponse(BaseModel):
    """Daily nutrition summary."""
    date: date
    total_calories: int
    total_protein: int
    total_carbs: int
    total_fat: int
    target_calories: Optional[int]
    target_protein: Optional[int]
    target_carbs: Optional[int]
    target_fat: Optional[int]
