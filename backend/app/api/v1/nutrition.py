"""Nutrition tracking endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

from ...api.deps import get_db, get_current_user
from ...models.user import User, UserSettings
from ...models.nutrition import MealCategory, Food, Meal, MealItem
from ...schemas.nutrition import (
    MealCategoryCreate,
    MealCategoryUpdate,
    MealCategoryResponse,
    FoodCreate,
    FoodUpdate,
    FoodResponse,
    MealCreate,
    MealResponse,
    MealListResponse,
    NutritionSummaryResponse,
)

router = APIRouter()


# ===== MEAL CATEGORIES =====

@router.get("/meal-categories", response_model=List[MealCategoryResponse])
def get_meal_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's meal categories."""
    categories = db.query(MealCategory).filter(
        MealCategory.user_id == current_user.id,
        MealCategory.deleted_at.is_(None)
    ).order_by(MealCategory.display_order).all()

    return categories


@router.post("/meal-categories", response_model=MealCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_meal_category(
    category_data: MealCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a meal category."""
    category = MealCategory(
        **category_data.model_dump(),
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/meal-categories/{category_id}", response_model=MealCategoryResponse)
def update_meal_category(
    category_id: UUID,
    category_data: MealCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a meal category."""
    category = db.query(MealCategory).filter(
        MealCategory.id == category_id,
        MealCategory.user_id == current_user.id,
        MealCategory.deleted_at.is_(None)
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Update fields
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    category.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(category)
    return category


@router.delete("/meal-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a meal category."""
    category = db.query(MealCategory).filter(
        MealCategory.id == category_id,
        MealCategory.user_id == current_user.id,
        MealCategory.deleted_at.is_(None)
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    category.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ===== FOODS =====

@router.get("/foods", response_model=List[FoodResponse])
def get_foods(
    search: Optional[str] = Query(None, description="Search by name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get foods (system + user custom foods).

    Supports search by name.
    """
    query = db.query(Food).filter(
        and_(
            Food.deleted_at.is_(None),
            or_(
                Food.is_custom == False,  # System foods
                Food.user_id == current_user.id  # User's custom foods
            )
        )
    )

    # Apply search filter
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))

    # Order by name and apply pagination
    foods = query.order_by(Food.name).offset(skip).limit(limit).all()

    return foods


@router.post("/foods", response_model=FoodResponse, status_code=status.HTTP_201_CREATED)
def create_food(
    food_data: FoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a custom food.

    User-created foods are only visible to that user.
    """
    food = Food(
        **food_data.model_dump(),
        is_custom=True,
        user_id=current_user.id
    )
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


@router.put("/foods/{food_id}", response_model=FoodResponse)
def update_food(
    food_id: UUID,
    food_data: FoodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a custom food.

    Only the food owner can update it.
    """
    food = db.query(Food).filter(
        Food.id == food_id,
        Food.user_id == current_user.id,
        Food.is_custom == True,
        Food.deleted_at.is_(None)
    ).first()

    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found or not owned by user"
        )

    # Update fields
    update_data = food_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(food, field, value)

    food.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(food)
    return food


@router.delete("/foods/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(
    food_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a custom food.

    Only the food owner can delete it.
    """
    food = db.query(Food).filter(
        Food.id == food_id,
        Food.user_id == current_user.id,
        Food.is_custom == True,
        Food.deleted_at.is_(None)
    ).first()

    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food not found or not owned by user"
        )

    food.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ===== MEALS =====

@router.post("/meals", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def create_meal(
    meal_data: MealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a meal with food items.

    Automatically calculates and stores macro snapshots.
    """
    # Verify category exists
    category = db.query(MealCategory).filter(
        MealCategory.id == meal_data.category_id,
        MealCategory.user_id == current_user.id,
        MealCategory.deleted_at.is_(None)
    ).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Create meal with category name snapshot
    meal = Meal(
        user_id=current_user.id,
        category_id=meal_data.category_id,
        category_name_snapshot=category.name,
        meal_date=meal_data.meal_date,
        meal_time=meal_data.meal_time
    )
    db.add(meal)
    db.flush()

    # Add food items with macro snapshots
    for item_data in meal_data.items:
        # Get food
        food = db.query(Food).filter(
            Food.id == item_data.food_id,
            Food.deleted_at.is_(None)
        ).first()

        if not food:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food {item_data.food_id} not found"
            )

        # Create meal item with snapshots (calculate total for servings)
        meal_item = MealItem(
            meal_id=meal.id,
            food_id=item_data.food_id,
            servings=item_data.servings,
            food_name_snapshot=food.name,
            calories_snapshot=int(food.calories * item_data.servings),
            protein_snapshot=int(food.protein * item_data.servings),
            carbs_snapshot=int(food.carbs * item_data.servings),
            fat_snapshot=int(food.fat * item_data.servings),
        )
        db.add(meal_item)

    db.commit()
    db.refresh(meal)

    # Load items for response
    meal = db.query(Meal).options(
        joinedload(Meal.items)
    ).filter(Meal.id == meal.id).first()

    return meal


@router.get("/meals", response_model=List[MealListResponse])
def get_meals(
    meal_date: Optional[date] = Query(None, description="Filter by date"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's meals with optional date filter."""
    query = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.deleted_at.is_(None)
    )

    # Apply date filters
    if meal_date:
        query = query.filter(Meal.meal_date == meal_date)
    if start_date:
        query = query.filter(Meal.meal_date >= start_date)
    if end_date:
        query = query.filter(Meal.meal_date <= end_date)

    meals = query.order_by(Meal.meal_date.desc(), Meal.meal_time.desc()).offset(skip).limit(limit).all()

    return meals


@router.get("/meals/{meal_id}", response_model=MealResponse)
def get_meal(
    meal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a meal with all items."""
    meal = db.query(Meal).options(
        joinedload(Meal.items)
    ).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id,
        Meal.deleted_at.is_(None)
    ).first()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    return meal


@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    meal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a meal."""
    meal = db.query(Meal).filter(
        Meal.id == meal_id,
        Meal.user_id == current_user.id,
        Meal.deleted_at.is_(None)
    ).first()

    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

    meal.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ===== NUTRITION SUMMARY =====

@router.get("/summary", response_model=NutritionSummaryResponse)
def get_nutrition_summary(
    summary_date: date = Query(..., description="Date for summary"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily nutrition summary.

    Returns total macros for the day vs targets.
    """
    # Get user settings for targets
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    # Calculate totals from meal items for the date
    totals = db.query(
        func.sum(MealItem.calories_snapshot).label('total_calories'),
        func.sum(MealItem.protein_snapshot).label('total_protein'),
        func.sum(MealItem.carbs_snapshot).label('total_carbs'),
        func.sum(MealItem.fat_snapshot).label('total_fat'),
    ).join(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date == summary_date,
        Meal.deleted_at.is_(None)
    ).first()

    return NutritionSummaryResponse(
        date=summary_date,
        total_calories=totals.total_calories or 0,
        total_protein=totals.total_protein or 0,
        total_carbs=totals.total_carbs or 0,
        total_fat=totals.total_fat or 0,
        target_calories=settings.macro_target_calories if settings else None,
        target_protein=settings.macro_target_protein if settings else None,
        target_carbs=settings.macro_target_carbs if settings else None,
        target_fat=settings.macro_target_fat if settings else None,
    )
