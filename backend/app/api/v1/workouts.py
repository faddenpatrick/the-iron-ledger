"""Workout logging and template management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta, timezone

from ...api.deps import get_db, get_current_user
from ...models.user import User
from ...models.exercise import Exercise, WorkoutTemplate, TemplateExercise
from ...models.workout import Workout, Set
from ...schemas.exercise import (
    WorkoutTemplateCreate,
    WorkoutTemplateUpdate,
    WorkoutTemplateResponse,
    WorkoutTemplateListResponse,
)
from ...schemas.workout import (
    WorkoutCreate,
    WorkoutResponse,
    WorkoutListResponse,
    WorkoutCompleteRequest,
    SetCreate,
    SetUpdate,
    SetResponse,
    SaveAsTemplateRequest,
    PreviousPerformanceResponse,
    PreviousSetData,
    WorkoutWeeklyStatsResponse,
)

router = APIRouter()


# ===== WORKOUT TEMPLATES =====

@router.get("/templates", response_model=List[WorkoutTemplateListResponse])
def get_templates(
    workout_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workout templates, optionally filtered by workout_type."""
    query = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.user_id == current_user.id,
        WorkoutTemplate.deleted_at.is_(None)
    )

    # Apply workout_type filter if specified
    if workout_type:
        query = query.filter(WorkoutTemplate.workout_type == workout_type)

    templates = query.order_by(WorkoutTemplate.created_at.desc()).all()

    return templates


@router.post("/templates", response_model=WorkoutTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: WorkoutTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a workout template with exercises."""
    # Create template
    template = WorkoutTemplate(
        name=template_data.name,
        workout_type=template_data.workout_type,
        user_id=current_user.id
    )
    db.add(template)
    db.flush()

    # Add exercises to template
    for exercise_data in template_data.exercises:
        # Verify exercise exists and user has access
        exercise = db.query(Exercise).filter(
            Exercise.id == exercise_data.exercise_id,
            Exercise.deleted_at.is_(None),
            or_(
                Exercise.is_custom == False,
                Exercise.user_id == current_user.id
            )
        ).first()

        if not exercise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise {exercise_data.exercise_id} not found"
            )

        template_exercise = TemplateExercise(
            template_id=template.id,
            **exercise_data.model_dump()
        )
        db.add(template_exercise)

    db.commit()
    db.refresh(template)

    # Load exercises for response
    template = db.query(WorkoutTemplate).options(
        joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise)
    ).filter(WorkoutTemplate.id == template.id).first()

    return template


@router.get("/templates/{template_id}", response_model=WorkoutTemplateResponse)
def get_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a workout template with exercises."""
    template = db.query(WorkoutTemplate).options(
        joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise)
    ).filter(
        WorkoutTemplate.id == template_id,
        WorkoutTemplate.user_id == current_user.id,
        WorkoutTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return template


@router.put("/templates/{template_id}", response_model=WorkoutTemplateResponse)
def update_template(
    template_id: UUID,
    template_data: WorkoutTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a workout template."""
    template = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.id == template_id,
        WorkoutTemplate.user_id == current_user.id,
        WorkoutTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Update name
    if template_data.name is not None:
        template.name = template_data.name

    # Update workout_type
    if template_data.workout_type is not None:
        template.workout_type = template_data.workout_type

    # Update exercises if provided
    if template_data.exercises is not None:
        # Delete existing exercises
        db.query(TemplateExercise).filter(
            TemplateExercise.template_id == template_id
        ).delete()

        # Add new exercises
        for exercise_data in template_data.exercises:
            template_exercise = TemplateExercise(
                template_id=template.id,
                **exercise_data.model_dump()
            )
            db.add(template_exercise)

    template.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(template)

    # Load exercises for response
    template = db.query(WorkoutTemplate).options(
        joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise)
    ).filter(WorkoutTemplate.id == template.id).first()

    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a workout template."""
    template = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.id == template_id,
        WorkoutTemplate.user_id == current_user.id,
        WorkoutTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    template.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None


# ===== WORKOUT SESSIONS =====

@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout_data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a workout session.

    Can be from a template or freestyle.
    """
    template_name_snapshot = None

    # If using a template, verify it exists and snapshot the name
    template = None
    if workout_data.template_id:
        template = db.query(WorkoutTemplate).options(
            joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise)
        ).filter(
            WorkoutTemplate.id == workout_data.template_id,
            WorkoutTemplate.user_id == current_user.id,
            WorkoutTemplate.deleted_at.is_(None)
        ).first()

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        template_name_snapshot = template.name

    # Create workout
    workout = Workout(
        user_id=current_user.id,
        template_id=workout_data.template_id,
        template_name_snapshot=template_name_snapshot,
        workout_type=workout_data.workout_type,
        workout_date=workout_data.workout_date,
        started_at=workout_data.started_at
    )
    db.add(workout)
    db.flush()  # Get workout.id

    # If using a template, create sets from template exercises
    if template:
        for template_exercise in template.exercises:
            # Tally mode exercises start with zero sets — user adds them via taps
            if template_exercise.tally_mode:
                continue

            target_sets = template_exercise.target_sets or 3
            target_reps = template_exercise.target_reps or 10
            target_weight = template_exercise.target_weight or 0

            # Create sets for this exercise
            for set_num in range(1, target_sets + 1):
                workout_set = Set(
                    workout_id=workout.id,
                    exercise_id=template_exercise.exercise_id,
                    exercise_name_snapshot=template_exercise.exercise.name,
                    set_number=set_num,
                    set_type='normal',
                    weight=target_weight if target_weight > 0 else None,
                    reps=target_reps,
                    rpe=None,
                    is_completed=False,
                    completed_at=None
                )
                db.add(workout_set)

    db.commit()
    db.refresh(workout)

    return workout


@router.get("", response_model=List[WorkoutListResponse])
def get_workouts(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    workout_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workouts with optional date range and workout_type filters."""
    query = db.query(Workout).filter(
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    )

    # Apply date filters
    if start_date:
        query = query.filter(Workout.workout_date >= start_date)
    if end_date:
        query = query.filter(Workout.workout_date <= end_date)

    # Apply workout_type filter
    if workout_type:
        query = query.filter(Workout.workout_type == workout_type)

    workouts = query.order_by(Workout.workout_date.desc()).offset(skip).limit(limit).all()

    return workouts


@router.get("/weekly-stats", response_model=WorkoutWeeklyStatsResponse)
def get_weekly_stats(
    end_date: date = Query(..., description="End date for 7-day window"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 7-day workout statistics: count, volume, avg sets, avg duration."""
    start_date_val = end_date - timedelta(days=6)

    # Find completed workouts in range
    completed_workouts = db.query(Workout).filter(
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
        Workout.workout_date >= start_date_val,
        Workout.workout_date <= end_date,
    ).all()

    workouts_completed = len(completed_workouts)
    workout_ids = [w.id for w in completed_workouts]

    # Aggregate volume and sets from completed sets
    total_volume = 0.0
    total_sets = 0
    if workout_ids:
        stats = db.query(
            func.sum(
                func.coalesce(Set.weight, 0) * func.coalesce(Set.reps, 0)
            ).label('total_volume'),
            func.count(Set.id).label('total_sets'),
        ).filter(
            Set.workout_id.in_(workout_ids),
            Set.is_completed == True,
        ).first()
        total_volume = float(stats.total_volume or 0)
        total_sets = int(stats.total_sets or 0)

    # Calculate average workout duration
    avg_duration = None
    if completed_workouts:
        durations = []
        for w in completed_workouts:
            if w.started_at and w.completed_at:
                delta = (w.completed_at - w.started_at).total_seconds() / 60
                if 0 < delta < 480:  # Filter out unrealistic durations (> 8 hours)
                    durations.append(delta)
        if durations:
            avg_duration = round(sum(durations) / len(durations), 1)

    return WorkoutWeeklyStatsResponse(
        start_date=start_date_val,
        end_date=end_date,
        workouts_completed=workouts_completed,
        total_volume=total_volume,
        total_sets=total_sets,
        avg_sets_per_workout=round(total_sets / workouts_completed, 1) if workouts_completed > 0 else 0,
        avg_workout_duration_minutes=avg_duration,
    )


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a workout with all sets."""
    workout = db.query(Workout).options(
        joinedload(Workout.sets)
    ).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return workout


@router.post("/{workout_id}/complete", response_model=WorkoutResponse)
def complete_workout(
    workout_id: UUID,
    complete_data: WorkoutCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a workout as completed."""
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    workout.completed_at = complete_data.completed_at
    workout.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(workout)

    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a workout."""
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    workout.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None


@router.post("/{workout_id}/save-as-template", response_model=WorkoutTemplateResponse)
def save_workout_as_template(
    workout_id: UUID,
    save_data: SaveAsTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a freestyle workout as a template."""
    workout = db.query(Workout).options(
        joinedload(Workout.sets)
    ).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    # Create template
    template = WorkoutTemplate(
        name=save_data.template_name,
        workout_type=workout.workout_type,
        user_id=current_user.id
    )
    db.add(template)
    db.flush()

    # Add exercises from workout sets (unique exercises in order)
    exercise_ids_seen = set()
    order_index = 0

    for set_obj in workout.sets:
        if set_obj.exercise_id not in exercise_ids_seen:
            exercise_ids_seen.add(set_obj.exercise_id)

            template_exercise = TemplateExercise(
                template_id=template.id,
                exercise_id=set_obj.exercise_id,
                order_index=order_index,
                target_sets=None,  # Could calculate from sets
                target_reps=None,
                notes=None
            )
            db.add(template_exercise)
            order_index += 1

    db.commit()
    db.refresh(template)

    # Load exercises for response
    template = db.query(WorkoutTemplate).options(
        joinedload(WorkoutTemplate.exercises).joinedload(TemplateExercise.exercise)
    ).filter(WorkoutTemplate.id == template.id).first()

    return template


@router.get("/{workout_id}/exercises/{exercise_id}/previous", response_model=PreviousPerformanceResponse)
def get_previous_performance(
    workout_id: UUID,
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get previous performance for an exercise.

    Returns sets from the most recent completed workout where this exercise was logged
    (before the current workout date).
    """
    # Verify current workout belongs to user
    current_workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not current_workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    # Find the most recent completed workout with this exercise (before current workout)
    previous_workout = db.query(Workout).join(
        Set, Set.workout_id == Workout.id
    ).filter(
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),  # Only completed workouts
        Workout.workout_date < current_workout.workout_date,
        Set.exercise_id == exercise_id
    ).order_by(Workout.workout_date.desc()).first()

    if not previous_workout:
        # No previous performance found
        return PreviousPerformanceResponse(
            exercise_id=exercise_id,
            has_previous=False,
            previous_workout_date=None,
            previous_sets=[]
        )

    # Get sets from previous workout for this exercise (limit to 10)
    previous_sets = db.query(Set).filter(
        Set.workout_id == previous_workout.id,
        Set.exercise_id == exercise_id
    ).order_by(Set.set_number).limit(10).all()

    # Convert to response format
    set_data = [
        PreviousSetData(
            set_number=s.set_number,
            weight=s.weight,
            reps=s.reps,
            rpe=s.rpe
        )
        for s in previous_sets
    ]

    total_reps = sum(s.reps or 0 for s in previous_sets)

    return PreviousPerformanceResponse(
        exercise_id=exercise_id,
        has_previous=True,
        previous_workout_date=previous_workout.workout_date,
        previous_sets=set_data,
        previous_total_reps=total_reps
    )


# ===== SETS =====

@router.post("/{workout_id}/sets", response_model=SetResponse, status_code=status.HTTP_201_CREATED)
def add_set(
    workout_id: UUID,
    set_data: SetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a set to a workout."""
    # Verify workout exists and belongs to user
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    # Get exercise for snapshot
    exercise = db.query(Exercise).filter(
        Exercise.id == set_data.exercise_id,
        Exercise.deleted_at.is_(None)
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )

    # Create set with snapshot
    set_obj = Set(
        workout_id=workout_id,
        **set_data.model_dump(),
        exercise_name_snapshot=exercise.name  # Snapshot exercise name
    )
    db.add(set_obj)

    # Update workout timestamp
    workout.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(set_obj)

    return set_obj


@router.put("/{workout_id}/sets/{set_id}", response_model=SetResponse)
def update_set(
    workout_id: UUID,
    set_id: UUID,
    set_data: SetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a set."""
    # Verify workout exists and belongs to user
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    # Get set
    set_obj = db.query(Set).filter(
        Set.id == set_id,
        Set.workout_id == workout_id
    ).first()

    if not set_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found"
        )

    # Update fields
    update_data = set_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(set_obj, field, value)

    # If marking as completed, set timestamp
    if 'is_completed' in update_data and update_data['is_completed']:
        set_obj.completed_at = datetime.now(timezone.utc)
    elif 'is_completed' in update_data and not update_data['is_completed']:
        set_obj.completed_at = None

    # Update workout timestamp
    workout.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(set_obj)

    return set_obj


@router.delete("/{workout_id}/sets/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_set(
    workout_id: UUID,
    set_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a set."""
    # Verify workout exists and belongs to user
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.user_id == current_user.id,
        Workout.deleted_at.is_(None)
    ).first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    # Delete set
    set_obj = db.query(Set).filter(
        Set.id == set_id,
        Set.workout_id == workout_id
    ).first()

    if not set_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found"
        )

    db.delete(set_obj)

    # Update workout timestamp
    workout.updated_at = datetime.now(timezone.utc)

    db.commit()
    return None
