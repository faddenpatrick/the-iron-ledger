"""Admin dashboard metrics endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone

from ...api.deps import get_db, get_current_admin
from ...models.user import User, UserSettings, BodyMeasurement
from ...models.workout import Workout, Set
from ...models.nutrition import Meal
from ...models.exercise import Exercise, WorkoutTemplate
from ...models.supplement import Supplement
from ...schemas.admin import (
    AdminOverviewResponse,
    UserGrowthResponse,
    UserGrowthPoint,
    UserListResponse,
    UserDetailRow,
    FeatureAdoptionResponse,
)

router = APIRouter()


@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get high-level platform metrics."""
    total_users = db.query(func.count(User.id)).scalar()

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Active users = users with a workout or meal in the window
    active_7d_workout = db.query(Workout.user_id).filter(
        Workout.started_at >= seven_days_ago,
        Workout.deleted_at.is_(None),
    ).distinct()
    active_7d_meal = db.query(Meal.user_id).filter(
        Meal.created_at >= seven_days_ago,
        Meal.deleted_at.is_(None),
    ).distinct()
    active_7d = db.query(func.count()).select_from(
        active_7d_workout.union(active_7d_meal).subquery()
    ).scalar()

    active_30d_workout = db.query(Workout.user_id).filter(
        Workout.started_at >= thirty_days_ago,
        Workout.deleted_at.is_(None),
    ).distinct()
    active_30d_meal = db.query(Meal.user_id).filter(
        Meal.created_at >= thirty_days_ago,
        Meal.deleted_at.is_(None),
    ).distinct()
    active_30d = db.query(func.count()).select_from(
        active_30d_workout.union(active_30d_meal).subquery()
    ).scalar()

    total_completed = db.query(func.count(Workout.id)).filter(
        Workout.completed_at.isnot(None),
        Workout.deleted_at.is_(None),
    ).scalar()

    total_meals = db.query(func.count(Meal.id)).filter(
        Meal.deleted_at.is_(None),
    ).scalar()

    total_sets = db.query(func.count(Set.id)).filter(
        Set.is_completed.is_(True),
    ).scalar()

    # Avg workouts per active user
    users_with_workouts = db.query(
        func.count(func.distinct(Workout.user_id))
    ).filter(
        Workout.completed_at.isnot(None),
        Workout.deleted_at.is_(None),
    ).scalar()

    avg_per_user = (
        round(total_completed / users_with_workouts, 1)
        if users_with_workouts
        else None
    )

    return AdminOverviewResponse(
        total_users=total_users,
        users_active_last_7_days=active_7d,
        users_active_last_30_days=active_30d,
        total_workouts_completed=total_completed,
        total_meals_logged=total_meals,
        total_sets_logged=total_sets,
        avg_workouts_per_active_user=avg_per_user,
    )


@router.get("/user-growth", response_model=UserGrowthResponse)
def get_user_growth(
    days: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get daily user registration counts."""
    today = date.today()
    start = today - timedelta(days=days - 1)

    # Get registrations grouped by date
    registrations = (
        db.query(
            func.date(User.created_at).label("reg_date"),
            func.count(User.id).label("count"),
        )
        .filter(func.date(User.created_at) >= start)
        .group_by(func.date(User.created_at))
        .all()
    )

    reg_map = {r.reg_date: r.count for r in registrations}

    # Baseline: users created before the window
    baseline = db.query(func.count(User.id)).filter(
        func.date(User.created_at) < start
    ).scalar()

    data_points = []
    running = baseline
    for i in range(days):
        d = start + timedelta(days=i)
        new = reg_map.get(d, 0)
        running += new
        data_points.append(UserGrowthPoint(date=d, total_users=running, new_users=new))

    return UserGrowthResponse(data_points=data_points)


@router.get("/users", response_model=UserListResponse)
def get_user_list(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get all users with activity summaries."""
    users = db.query(User).order_by(User.created_at.desc()).all()

    rows = []
    for u in users:
        workout_count = db.query(func.count(Workout.id)).filter(
            Workout.user_id == u.id,
            Workout.completed_at.isnot(None),
            Workout.deleted_at.is_(None),
        ).scalar()

        meal_count = db.query(func.count(Meal.id)).filter(
            Meal.user_id == u.id,
            Meal.deleted_at.is_(None),
        ).scalar()

        # Last active: most recent workout or meal
        last_workout = db.query(func.max(Workout.started_at)).filter(
            Workout.user_id == u.id,
            Workout.deleted_at.is_(None),
        ).scalar()
        last_meal = db.query(func.max(Meal.created_at)).filter(
            Meal.user_id == u.id,
            Meal.deleted_at.is_(None),
        ).scalar()
        last_active_dt = max(filter(None, [last_workout, last_meal]), default=None)
        last_active = last_active_dt.date() if last_active_dt else None

        settings = db.query(UserSettings).filter(
            UserSettings.user_id == u.id
        ).first()

        rows.append(UserDetailRow(
            email=u.email,
            created_at=u.created_at.date(),
            last_active=last_active,
            total_workouts=workout_count,
            total_meals=meal_count,
            coach_type=settings.coach_type if settings else None,
            has_macro_targets=bool(settings and settings.macro_target_calories),
        ))

    return UserListResponse(users=rows, total=len(rows))


@router.get("/feature-adoption", response_model=FeatureAdoptionResponse)
def get_feature_adoption(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get feature adoption metrics across all users."""
    users_with_templates = db.query(
        func.count(func.distinct(WorkoutTemplate.user_id))
    ).filter(WorkoutTemplate.deleted_at.is_(None)).scalar()

    users_with_custom_exercises = db.query(
        func.count(func.distinct(Exercise.user_id))
    ).filter(
        Exercise.is_custom.is_(True),
        Exercise.deleted_at.is_(None),
    ).scalar()

    users_with_meals = db.query(
        func.count(func.distinct(Meal.user_id))
    ).filter(Meal.deleted_at.is_(None)).scalar()

    users_with_macros = db.query(func.count(UserSettings.id)).filter(
        UserSettings.macro_target_calories.isnot(None),
    ).scalar()

    users_with_supplements = db.query(
        func.count(func.distinct(Supplement.user_id))
    ).scalar()

    users_with_measurements = db.query(
        func.count(func.distinct(BodyMeasurement.user_id))
    ).scalar()

    # Coach type breakdown
    coach_counts = db.query(
        UserSettings.coach_type,
        func.count(UserSettings.id),
    ).group_by(UserSettings.coach_type).all()
    coach_breakdown = {ct: count for ct, count in coach_counts if ct}

    return FeatureAdoptionResponse(
        users_with_templates=users_with_templates,
        users_with_custom_exercises=users_with_custom_exercises,
        users_with_meals=users_with_meals,
        users_with_macro_targets=users_with_macros,
        users_with_supplements=users_with_supplements,
        users_with_measurements=users_with_measurements,
        coach_type_breakdown=coach_breakdown,
    )
