"""Exercise management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from ...api.deps import get_db, get_current_user
from ...models.user import User
from ...models.exercise import Exercise
from ...schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse

router = APIRouter()


@router.get("", response_model=List[ExerciseResponse])
def get_exercises(
    search: Optional[str] = Query(None, description="Search by name"),
    muscle_group: Optional[str] = Query(None, description="Filter by muscle group"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get exercises (system + user custom exercises).

    Supports search by name and filtering by muscle group and equipment.
    """
    query = db.query(Exercise).filter(
        and_(
            Exercise.deleted_at.is_(None),
            or_(
                Exercise.is_custom == False,  # System exercises
                Exercise.user_id == current_user.id  # User's custom exercises
            )
        )
    )

    # Apply filters
    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))
    if muscle_group:
        query = query.filter(Exercise.muscle_group == muscle_group)
    if equipment:
        query = query.filter(Exercise.equipment == equipment)

    # Order by name and apply pagination
    exercises = query.order_by(Exercise.name).offset(skip).limit(limit).all()

    return exercises


@router.post("", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise_data: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a custom exercise.

    User-created exercises are only visible to that user.
    """
    exercise = Exercise(
        **exercise_data.model_dump(),
        is_custom=True,
        user_id=current_user.id
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(
    exercise_id: UUID,
    exercise_data: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a custom exercise.

    Only the exercise owner can update it.
    """
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.user_id == current_user.id,
        Exercise.is_custom == True,
        Exercise.deleted_at.is_(None)
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found or not owned by user"
        )

    # Update fields
    update_data = exercise_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    exercise.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a custom exercise.

    Only the exercise owner can delete it.
    """
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.user_id == current_user.id,
        Exercise.is_custom == True,
        Exercise.deleted_at.is_(None)
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found or not owned by user"
        )

    exercise.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
