"""AI coaching insight endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone
from pydantic import BaseModel
from typing import Optional

from ...api.deps import get_db, get_current_user
from ...models.user import User, UserSettings, CoachInsight, BodyMeasurement
from ...models.workout import Workout, Set
from ...models.nutrition import Meal, MealItem
from ...models.supplement import Supplement, SupplementLog
from ...core.coach_personas import get_coach
from ...config import settings as app_settings


router = APIRouter()


class CoachInsightResponse(BaseModel):
    """AI coach insight response."""
    coach_name: str
    coach_title: str
    coach_type: str
    insight: str
    generated_at: datetime

    class Config:
        from_attributes = True


def _gather_user_data(user_id, user_settings: UserSettings, db: Session) -> str:
    """Gather recent workout and nutrition data for the coaching prompt."""
    today = date.today()
    week_ago = today - timedelta(days=6)
    units = user_settings.units if user_settings else "lbs"

    lines = []
    lines.append(f"User's preferred units: {units}")

    # --- Weekly workout stats ---
    completed_workouts = db.query(Workout).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
        Workout.workout_date >= week_ago,
        Workout.workout_date <= today,
    ).all()

    workouts_completed = len(completed_workouts)
    workout_ids = [w.id for w in completed_workouts]

    lines.append(f"\n--- WORKOUT DATA (last 7 days) ---")
    lines.append(f"Workouts completed: {workouts_completed}")

    if workout_ids:
        # Volume and sets
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
        lines.append(f"Total volume: {total_volume:.0f} {units}")
        lines.append(f"Total sets: {total_sets}")

        if workouts_completed > 0:
            lines.append(f"Avg sets per workout: {total_sets / workouts_completed:.1f}")

        # Avg duration
        durations = []
        for w in completed_workouts:
            if w.started_at and w.completed_at:
                delta = (w.completed_at - w.started_at).total_seconds() / 60
                if 0 < delta < 480:
                    durations.append(delta)
        if durations:
            lines.append(f"Avg workout duration: {sum(durations) / len(durations):.0f} minutes")

        # Exercise breakdown from recent workouts
        exercise_summary = db.query(
            Set.exercise_name_snapshot,
            func.count(Set.id).label('set_count'),
            func.max(Set.weight).label('max_weight'),
            func.max(Set.reps).label('max_reps'),
        ).filter(
            Set.workout_id.in_(workout_ids),
            Set.is_completed == True,
        ).group_by(Set.exercise_name_snapshot).all()

        if exercise_summary:
            lines.append("\nExercises performed this week:")
            for ex in exercise_summary:
                weight_str = f", max weight: {ex.max_weight} {units}" if ex.max_weight else ""
                lines.append(f"  - {ex.exercise_name_snapshot}: {ex.set_count} sets{weight_str}")
    else:
        lines.append("No workouts logged this week.")

    # --- Nutrition data ---
    lines.append(f"\n--- NUTRITION DATA (last 7 days) ---")

    # Daily totals for the week
    daily_totals = db.query(
        Meal.meal_date,
        func.sum(MealItem.calories_snapshot * MealItem.servings).label('daily_calories'),
        func.sum(MealItem.protein_snapshot * MealItem.servings).label('daily_protein'),
        func.sum(MealItem.carbs_snapshot * MealItem.servings).label('daily_carbs'),
        func.sum(MealItem.fat_snapshot * MealItem.servings).label('daily_fat'),
    ).join(MealItem).filter(
        Meal.user_id == user_id,
        Meal.meal_date >= week_ago,
        Meal.meal_date <= today,
        Meal.deleted_at.is_(None),
    ).group_by(Meal.meal_date).all()

    if daily_totals:
        total_cal = sum(day.daily_calories or 0 for day in daily_totals)
        total_pro = sum(day.daily_protein or 0 for day in daily_totals)
        total_carb = sum(day.daily_carbs or 0 for day in daily_totals)
        total_fat = sum(day.daily_fat or 0 for day in daily_totals)

        days_logged = len(daily_totals)
        lines.append(f"Days with nutrition logged: {days_logged} / 7")
        lines.append(f"Daily average calories: {int(total_cal) // 7}")
        lines.append(f"Daily average protein: {int(total_pro) // 7}g")
        lines.append(f"Daily average carbs: {int(total_carb) // 7}g")
        lines.append(f"Daily average fat: {int(total_fat) // 7}g")
    else:
        lines.append("No nutrition data logged this week.")

    # Macro targets
    if user_settings:
        targets = []
        if user_settings.macro_target_calories:
            targets.append(f"Calories: {user_settings.macro_target_calories}")
        if user_settings.macro_target_protein:
            targets.append(f"Protein: {user_settings.macro_target_protein}g")
        if user_settings.macro_target_carbs:
            targets.append(f"Carbs: {user_settings.macro_target_carbs}g")
        if user_settings.macro_target_fat:
            targets.append(f"Fat: {user_settings.macro_target_fat}g")
        if targets:
            lines.append(f"\nUser's daily macro targets: {', '.join(targets)}")

    # --- Body measurements ---
    lines.append(f"\n--- BODY MEASUREMENTS ---")

    latest_measurement = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == user_id,
        BodyMeasurement.weight.isnot(None),
    ).order_by(BodyMeasurement.measurement_date.desc()).first()

    if latest_measurement:
        lines.append(f"Current weight: {latest_measurement.weight} {units} (logged {latest_measurement.measurement_date})")

        # Look for a measurement from ~30 days ago
        thirty_days_ago = today - timedelta(days=30)
        old_measurement = db.query(BodyMeasurement).filter(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.weight.isnot(None),
            BodyMeasurement.measurement_date <= thirty_days_ago,
        ).order_by(BodyMeasurement.measurement_date.desc()).first()

        if old_measurement:
            change = latest_measurement.weight - old_measurement.weight
            direction = "+" if change > 0 else ""
            lines.append(f"Weight {old_measurement.measurement_date}: {old_measurement.weight} {units}")
            lines.append(f"Weight change (30 days): {direction}{change:.1f} {units}")
    else:
        lines.append("No body weight data logged yet.")

    # --- Supplements ---
    lines.append(f"\n--- SUPPLEMENTS ---")

    active_supplements = db.query(Supplement).filter(
        Supplement.user_id == user_id,
        Supplement.is_active == True,
    ).all()

    if active_supplements:
        # List active supplements
        supp_list = []
        for s in active_supplements:
            dosage_str = f" ({s.dosage})" if s.dosage else ""
            supp_list.append(f"{s.name}{dosage_str}")
        lines.append(f"Active supplements: {', '.join(supp_list)}")

        # Today's intake
        today_logs = db.query(SupplementLog).filter(
            SupplementLog.user_id == user_id,
            SupplementLog.log_date == today,
            SupplementLog.taken == True,
        ).all()
        logged_ids = {log.supplement_id for log in today_logs}

        today_status = []
        for s in active_supplements:
            status = "taken" if s.id in logged_ids else "not taken"
            today_status.append(f"{s.name}: {status}")
        lines.append(f"Today's supplement intake: {', '.join(today_status)}")

        # Weekly adherence
        week_total_possible = len(active_supplements) * 7
        week_logs = db.query(SupplementLog).filter(
            SupplementLog.user_id == user_id,
            SupplementLog.log_date >= week_ago,
            SupplementLog.log_date <= today,
            SupplementLog.taken == True,
        ).count()
        if week_total_possible > 0:
            adherence_pct = (week_logs / week_total_possible) * 100
            lines.append(f"Weekly supplement adherence: {adherence_pct:.0f}% ({week_logs}/{week_total_possible} doses)")
    else:
        lines.append("No supplements configured.")

    return "\n".join(lines)


async def _generate_insight(coach_type: str, user_data: str) -> str:
    """Call Gemini API to generate a coaching insight."""
    if not app_settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI coaching is not configured. GEMINI_API_KEY is missing."
        )

    from google import genai
    from google.genai import types

    coach = get_coach(coach_type)
    system_prompt = coach["system_prompt"]

    user_prompt = (
        f"Here is the user's recent fitness data. Based on this data, "
        f"give them one personalized coaching insight:\n\n{user_data}"
    )

    try:
        client = genai.Client(api_key=app_settings.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        return response.text.strip()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Gemini API error: {type(e).__name__}: {e}")

        error_str = str(e).lower()
        if "quota" in error_str or "resource_exhausted" in error_str or "429" in error_str:
            raise HTTPException(
                status_code=503,
                detail="AI coaching quota exceeded. Please check your Gemini API billing."
            )
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate coaching insight: {str(e)}"
        )


@router.get("/coaching/insight", response_model=CoachInsightResponse)
async def get_coaching_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get daily AI coaching insight.

    Returns a cached insight if one exists for today.
    Generates a new one via Gemini if not.
    """
    # Get user settings
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    coach_type = user_settings.coach_type if user_settings else "arnold"
    coach = get_coach(coach_type)
    today = date.today()

    # Check for cached insight from today with matching coach
    cached = db.query(CoachInsight).filter(
        CoachInsight.user_id == current_user.id,
        CoachInsight.insight_date == today,
        CoachInsight.coach_type == coach_type,
    ).first()

    if cached:
        return CoachInsightResponse(
            coach_name=coach["name"],
            coach_title=coach["title"],
            coach_type=coach_type,
            insight=cached.insight,
            generated_at=cached.created_at,
        )

    # No cached insight — gather data and generate
    user_data = _gather_user_data(current_user.id, user_settings, db)
    insight_text = await _generate_insight(coach_type, user_data)

    # Delete any old insights for today (e.g. from a different coach)
    db.query(CoachInsight).filter(
        CoachInsight.user_id == current_user.id,
        CoachInsight.insight_date == today,
    ).delete()

    # Cache the new insight
    new_insight = CoachInsight(
        user_id=current_user.id,
        coach_type=coach_type,
        insight=insight_text,
        insight_date=today,
    )
    db.add(new_insight)
    db.commit()
    db.refresh(new_insight)

    return CoachInsightResponse(
        coach_name=coach["name"],
        coach_title=coach["title"],
        coach_type=coach_type,
        insight=insight_text,
        generated_at=new_insight.created_at,
    )
