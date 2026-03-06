"""AI coaching insight endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from ...api.deps import get_db, get_current_user
from ...models.user import User, UserSettings, CoachInsight, BodyMeasurement
from ...models.workout import Workout, Set
from ...models.nutrition import Meal, MealItem, CheatDay
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


class DailyCoachingResponse(BaseModel):
    """Full daily coaching response with 3 sections."""
    coach_name: str
    coach_title: str
    coach_type: str
    summary: str
    workout_tips: str
    nutrition_tips: str
    generated_at: datetime


def _completed_workout_subquery(user_id, db, start_date=None, end_date=None):
    """Build a subquery for completed workout IDs with optional date range."""
    q = db.query(Workout.id).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
    )
    if start_date is not None:
        q = q.filter(Workout.workout_date >= start_date)
    if end_date is not None:
        q = q.filter(Workout.workout_date <= end_date)
    return q.subquery()


def _week_volume(workout_sq, db):
    """Get total volume for a set of workout IDs."""
    return db.query(
        func.sum(func.coalesce(Set.weight, 0) * func.coalesce(Set.reps, 0))
    ).filter(
        Set.workout_id.in_(workout_sq),
        Set.is_completed == True,
    ).scalar() or 0


def _gather_user_data(user_id, user_settings: UserSettings, db: Session) -> str:
    """Gather workout, nutrition, and historical trend data for the coaching prompt."""
    today = date.today()
    week_ago = today - timedelta(days=6)
    units = user_settings.units if user_settings else "lbs"

    lines = []
    lines.append(f"User's preferred units: {units}")

    # ================================================================
    # ALL-TIME OVERVIEW
    # ================================================================
    all_time_sq = _completed_workout_subquery(user_id, db)

    total_workouts_ever = db.query(func.count(Workout.id)).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
    ).scalar() or 0

    first_workout = db.query(func.min(Workout.workout_date)).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
    ).scalar()

    lines.append(f"\n--- ALL-TIME OVERVIEW ---")
    if first_workout:
        total_days_active = (today - first_workout).days + 1
        weeks_active = max(total_days_active / 7, 1)
        avg_per_week = total_workouts_ever / weeks_active

        all_time_volume = _week_volume(all_time_sq, db)

        lines.append(f"Member since: {first_workout} ({total_days_active} days)")
        lines.append(f"Total workouts completed: {total_workouts_ever}")
        lines.append(f"Average workouts per week: {avg_per_week:.1f}")
        lines.append(f"Total volume lifted (all time): {all_time_volume:,.0f} {units}")
    else:
        lines.append("No workouts completed yet.")

    # ================================================================
    # MONTHLY COMPARISON (last 30 days vs previous 30 days)
    # ================================================================
    thirty_days_ago = today - timedelta(days=29)
    sixty_days_ago = today - timedelta(days=59)

    this_month_sq = _completed_workout_subquery(user_id, db, thirty_days_ago, today)
    last_month_sq = _completed_workout_subquery(user_id, db, sixty_days_ago, thirty_days_ago - timedelta(days=1))

    this_month_count = db.query(func.count(Workout.id)).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
        Workout.workout_date >= thirty_days_ago,
        Workout.workout_date <= today,
    ).scalar() or 0

    last_month_count = db.query(func.count(Workout.id)).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
        Workout.workout_date >= sixty_days_ago,
        Workout.workout_date < thirty_days_ago,
    ).scalar() or 0

    lines.append(f"\n--- MONTHLY COMPARISON (last 30 days vs previous 30 days) ---")

    if this_month_count > 0 or last_month_count > 0:
        this_month_vol = _week_volume(this_month_sq, db)
        last_month_vol = _week_volume(last_month_sq, db)

        lines.append(f"This month: {this_month_count} workouts, {this_month_vol:,.0f} {units} volume")
        lines.append(f"Last month: {last_month_count} workouts, {last_month_vol:,.0f} {units} volume")

        if last_month_count > 0:
            freq_change = ((this_month_count - last_month_count) / last_month_count) * 100
            lines.append(f"Workout frequency change: {freq_change:+.0f}%")
        if last_month_vol > 0:
            vol_change = ((this_month_vol - last_month_vol) / last_month_vol) * 100
            lines.append(f"Volume change: {vol_change:+.0f}%")
    else:
        lines.append("Not enough data for monthly comparison.")

    # ================================================================
    # EXERCISE PROGRESSION (top 5 exercises by frequency)
    # ================================================================
    lines.append(f"\n--- EXERCISE PROGRESSION (top exercises) ---")

    top_exercises = db.query(
        Set.exercise_name_snapshot,
        func.count(Set.id).label('total_sets'),
    ).filter(
        Set.workout_id.in_(all_time_sq),
        Set.is_completed == True,
        Set.weight.isnot(None),
    ).group_by(Set.exercise_name_snapshot).order_by(
        func.count(Set.id).desc()
    ).limit(5).all()

    if top_exercises:
        for ex_name, total_sets in top_exercises:
            all_time_pr = db.query(func.max(Set.weight)).filter(
                Set.workout_id.in_(all_time_sq),
                Set.exercise_name_snapshot == ex_name,
                Set.is_completed == True,
            ).scalar()

            best_this_month = db.query(func.max(Set.weight)).filter(
                Set.workout_id.in_(this_month_sq),
                Set.exercise_name_snapshot == ex_name,
                Set.is_completed == True,
            ).scalar()

            best_last_month = db.query(func.max(Set.weight)).filter(
                Set.workout_id.in_(last_month_sq),
                Set.exercise_name_snapshot == ex_name,
                Set.is_completed == True,
            ).scalar()

            parts = [f"{ex_name}: All-time PR {all_time_pr} {units}"]
            if best_this_month is not None:
                parts.append(f"This month best: {best_this_month} {units}")
            if best_last_month is not None and best_this_month is not None:
                diff = best_this_month - best_last_month
                direction = "+" if diff > 0 else ""
                tag = " [REGRESSION]" if diff < 0 else (" [PR]" if best_this_month >= all_time_pr and diff > 0 else "")
                parts.append(f"Last month best: {best_last_month} {units} ({direction}{diff} {units}){tag}")
            elif best_last_month is not None:
                parts.append(f"Last month best: {best_last_month} {units}")

            lines.append(f"  - {' | '.join(parts)}")
    else:
        lines.append("No weighted exercise data yet.")

    # ================================================================
    # CONSISTENCY (last 8 weeks)
    # ================================================================
    lines.append(f"\n--- CONSISTENCY (last 8 weeks) ---")

    weekly_workout_counts = []
    weekly_nutrition_days = []
    for week_offset in range(8):
        w_end = today - timedelta(days=week_offset * 7)
        w_start = w_end - timedelta(days=6)

        wk_count = db.query(func.count(Workout.id)).filter(
            Workout.user_id == user_id,
            Workout.deleted_at.is_(None),
            Workout.completed_at.isnot(None),
            Workout.workout_date >= w_start,
            Workout.workout_date <= w_end,
        ).scalar() or 0
        weekly_workout_counts.append(wk_count)

        nutr_days = db.query(func.count(func.distinct(Meal.meal_date))).filter(
            Meal.user_id == user_id,
            Meal.meal_date >= w_start,
            Meal.meal_date <= w_end,
            Meal.deleted_at.is_(None),
        ).scalar() or 0
        weekly_nutrition_days.append(nutr_days)

    lines.append(f"Workout frequency (newest first): {', '.join(str(c) for c in weekly_workout_counts)} workouts/week")
    if weekly_workout_counts:
        avg_freq = sum(weekly_workout_counts) / len(weekly_workout_counts)
        lines.append(f"Average: {avg_freq:.1f}/week")

    lines.append(f"Nutrition logging (newest first): {', '.join(str(d) for d in weekly_nutrition_days)} days/week")
    if weekly_nutrition_days:
        avg_nutr = sum(weekly_nutrition_days) / len(weekly_nutrition_days)
        lines.append(f"Average: {avg_nutr:.1f} days/week")

    # ================================================================
    # THIS WEEK WORKOUT DETAIL (existing, kept for immediate context)
    # ================================================================
    completed_workouts = db.query(Workout).filter(
        Workout.user_id == user_id,
        Workout.deleted_at.is_(None),
        Workout.completed_at.isnot(None),
        Workout.workout_date >= week_ago,
        Workout.workout_date <= today,
    ).all()

    workouts_completed = len(completed_workouts)
    workout_ids = [w.id for w in completed_workouts]

    lines.append(f"\n--- THIS WEEK WORKOUT DETAIL (last 7 days) ---")
    lines.append(f"Workouts completed: {workouts_completed}")

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
        lines.append(f"Total volume: {total_volume:.0f} {units}")
        lines.append(f"Total sets: {total_sets}")

        if workouts_completed > 0:
            lines.append(f"Avg sets per workout: {total_sets / workouts_completed:.1f}")

        durations = []
        for w in completed_workouts:
            if w.started_at and w.completed_at:
                delta = (w.completed_at - w.started_at).total_seconds() / 60
                if 0 < delta < 480:
                    durations.append(delta)
        if durations:
            lines.append(f"Avg workout duration: {sum(durations) / len(durations):.0f} minutes")

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

    # ================================================================
    # NUTRITION TRENDS (last 4 weeks)
    # ================================================================
    lines.append(f"\n--- NUTRITION TRENDS (last 4 weeks, excluding cheat days) ---")

    for week_offset in range(4):
        w_end = today - timedelta(days=week_offset * 7)
        w_start = w_end - timedelta(days=6)

        week_cheat_dates = {cd.cheat_date for cd in db.query(CheatDay).filter(
            CheatDay.user_id == user_id,
            CheatDay.cheat_date >= w_start,
            CheatDay.cheat_date <= w_end,
        ).all()}

        week_daily = db.query(
            Meal.meal_date,
            func.sum(MealItem.calories_snapshot * MealItem.servings).label('cal'),
            func.sum(MealItem.protein_snapshot * MealItem.servings).label('pro'),
            func.sum(MealItem.carbs_snapshot * MealItem.servings).label('carbs'),
            func.sum(MealItem.fat_snapshot * MealItem.servings).label('fat'),
        ).join(MealItem).filter(
            Meal.user_id == user_id,
            Meal.meal_date >= w_start,
            Meal.meal_date <= w_end,
            Meal.deleted_at.is_(None),
        ).group_by(Meal.meal_date).all()

        non_cheat = [d for d in week_daily if d.meal_date not in week_cheat_dates]
        days_logged = len(non_cheat)

        label = "This week" if week_offset == 0 else f"Week -{week_offset}"
        if non_cheat:
            denominator = max(7 - len(week_cheat_dates), 1)
            avg_cal = int(sum(d.cal or 0 for d in non_cheat)) // denominator
            avg_pro = int(sum(d.pro or 0 for d in non_cheat)) // denominator
            avg_carbs = int(sum(d.carbs or 0 for d in non_cheat)) // denominator
            avg_fat = int(sum(d.fat or 0 for d in non_cheat)) // denominator
            lines.append(f"{label}: avg {avg_cal} cal | {avg_pro}g protein | {avg_carbs}g carbs | {avg_fat}g fat ({days_logged} days logged)")
        else:
            lines.append(f"{label}: No nutrition data logged")

    # ================================================================
    # THIS WEEK CHEAT DAYS & NUTRITION DETAIL
    # ================================================================
    cheat_days_list = db.query(CheatDay).filter(
        CheatDay.user_id == user_id,
        CheatDay.cheat_date >= week_ago,
        CheatDay.cheat_date <= today,
    ).order_by(CheatDay.cheat_date).all()
    cheat_date_set = {cd.cheat_date for cd in cheat_days_list}

    lines.append(f"\n--- THIS WEEK CHEAT DAYS ---")
    if cheat_days_list:
        cheat_count = len(cheat_days_list)
        cheat_dates_str = ", ".join(str(cd.cheat_date) for cd in cheat_days_list)
        lines.append(f"Cheat days this week: {cheat_count} ({cheat_dates_str})")

        if cheat_count >= 3:
            sorted_dates = sorted(cd.cheat_date for cd in cheat_days_list)
            max_streak = 1
            current_streak = 1
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 1
            if max_streak >= 3:
                lines.append(f"WARNING: {max_streak} consecutive cheat days detected")
    else:
        lines.append("Cheat days this week: 0")

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

    # ================================================================
    # BODY MEASUREMENTS
    # ================================================================
    lines.append(f"\n--- BODY MEASUREMENTS ---")

    latest_measurement = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == user_id,
        BodyMeasurement.weight.isnot(None),
    ).order_by(BodyMeasurement.measurement_date.desc()).first()

    if latest_measurement:
        lines.append(f"Current weight: {latest_measurement.weight} {units} (logged {latest_measurement.measurement_date})")

        thirty_days_ago_bm = today - timedelta(days=30)
        old_measurement = db.query(BodyMeasurement).filter(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.weight.isnot(None),
            BodyMeasurement.measurement_date <= thirty_days_ago_bm,
        ).order_by(BodyMeasurement.measurement_date.desc()).first()

        if old_measurement:
            change = latest_measurement.weight - old_measurement.weight
            direction = "+" if change > 0 else ""
            lines.append(f"Weight {old_measurement.measurement_date}: {old_measurement.weight} {units}")
            lines.append(f"Weight change (30 days): {direction}{change:.1f} {units}")
    else:
        lines.append("No body weight data logged yet.")

    # ================================================================
    # SUPPLEMENTS
    # ================================================================
    lines.append(f"\n--- SUPPLEMENTS ---")

    active_supplements = db.query(Supplement).filter(
        Supplement.user_id == user_id,
        Supplement.is_active == True,
    ).all()

    if active_supplements:
        supp_list = []
        for s in active_supplements:
            dosage_str = f" ({s.dosage})" if s.dosage else ""
            supp_list.append(f"{s.name}{dosage_str}")
        lines.append(f"Active supplements: {', '.join(supp_list)}")

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


async def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Call Gemini API with given prompts."""
    if not app_settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI coaching is not configured. GEMINI_API_KEY is missing."
        )

    from google import genai
    from google.genai import types

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


async def _generate_insight(coach_type: str, user_data: str) -> str:
    """Generate a single short coaching insight."""
    coach = get_coach(coach_type)
    user_prompt = (
        f"Here is the user's fitness data, including both recent activity and historical trends. "
        f"Based on this data, give them one personalized coaching insight with a specific, "
        f"actionable suggestion to improve their diet or workout routine:\n\n{user_data}"
    )
    return await _call_gemini(coach["system_prompt"], user_prompt)


def _parse_coaching_sections(text: str) -> dict:
    """Parse structured coaching output into 3 sections."""
    sections = {"summary": "", "workout_tips": "", "nutrition_tips": ""}

    # Try to split by markers
    import re
    summary_match = re.search(r'\[SUMMARY\](.*?)(?=\[WORKOUT_TIPS\]|$)', text, re.DOTALL)
    workout_match = re.search(r'\[WORKOUT_TIPS\](.*?)(?=\[NUTRITION_TIPS\]|$)', text, re.DOTALL)
    nutrition_match = re.search(r'\[NUTRITION_TIPS\](.*?)$', text, re.DOTALL)

    if summary_match:
        sections["summary"] = summary_match.group(1).strip()
    if workout_match:
        sections["workout_tips"] = workout_match.group(1).strip()
    if nutrition_match:
        sections["nutrition_tips"] = nutrition_match.group(1).strip()

    # Fallback: if parsing failed, put everything in summary
    if not sections["summary"] and not sections["workout_tips"]:
        sections["summary"] = text
        sections["workout_tips"] = "No specific workout tips available today."
        sections["nutrition_tips"] = "No specific nutrition tips available today."

    return sections


async def _generate_daily_coaching(coach_type: str, user_data: str) -> dict:
    """Generate full daily coaching with 3 structured sections."""
    coach = get_coach(coach_type)
    user_prompt = (
        "Here is the user's fitness data, including both recent activity and historical trends.\n\n"
        f"{user_data}\n\n"
        "Based on this data, provide a comprehensive daily coaching report with THREE sections. "
        "Use EXACTLY these section markers on their own line:\n\n"
        "[SUMMARY]\n"
        "Write a detailed daily summary (2-3 paragraphs). Review their recent performance, "
        "what's going well, what needs improvement, progress toward their goals, and a motivational closing. "
        "Reference specific numbers from their data.\n\n"
        "[WORKOUT_TIPS]\n"
        "Write 3-5 specific, actionable workout coaching tips. Include: exercise suggestions or swaps, "
        "when to increase weight based on their progression data, deload timing recommendations, "
        "training split adjustments, and form or technique cues for their top exercises. "
        "Each tip should be a bullet point starting with a dash (-).\n\n"
        "[NUTRITION_TIPS]\n"
        "Write 3-5 specific, actionable nutrition and supplement recommendations. Include: "
        "macro adjustments based on their trends vs targets, meal timing suggestions, "
        "supplement recommendations or adherence feedback, and specific food suggestions to hit their targets. "
        "Each tip should be a bullet point starting with a dash (-)."
    )
    text = await _call_gemini(coach["system_prompt"], user_prompt)
    return _parse_coaching_sections(text)


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

    coach_type = user_settings.coach_type if user_settings else "old_school"
    coach = get_coach(coach_type)
    today = date.today()

    # Check for cached insight from today with matching coach
    cached = db.query(CoachInsight).filter(
        CoachInsight.user_id == current_user.id,
        CoachInsight.insight_date == today,
        CoachInsight.coach_type == coach_type,
        CoachInsight.section == "insight",
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
        CoachInsight.section == "insight",
    ).delete()

    # Cache the new insight
    new_insight = CoachInsight(
        user_id=current_user.id,
        coach_type=coach_type,
        section="insight",
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


@router.get("/coaching/daily-coaching", response_model=DailyCoachingResponse)
async def get_daily_coaching(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get full daily AI coaching with summary, workout tips, and nutrition tips.

    Returns cached coaching if one exists for today.
    Generates a new one via Gemini if not.
    """
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    coach_type = user_settings.coach_type if user_settings else "old_school"
    coach = get_coach(coach_type)
    today = date.today()

    # Check for cached daily coaching
    cached = db.query(CoachInsight).filter(
        CoachInsight.user_id == current_user.id,
        CoachInsight.insight_date == today,
        CoachInsight.coach_type == coach_type,
        CoachInsight.section == "daily_coaching",
    ).first()

    if cached:
        sections = _parse_coaching_sections(cached.insight)
        return DailyCoachingResponse(
            coach_name=coach["name"],
            coach_title=coach["title"],
            coach_type=coach_type,
            summary=sections["summary"],
            workout_tips=sections["workout_tips"],
            nutrition_tips=sections["nutrition_tips"],
            generated_at=cached.created_at,
        )

    # Generate new coaching
    user_data = _gather_user_data(current_user.id, user_settings, db)
    sections = await _generate_daily_coaching(coach_type, user_data)

    # Store the raw text with markers for re-parsing on cache hit
    raw_text = (
        f"[SUMMARY]\n{sections['summary']}\n\n"
        f"[WORKOUT_TIPS]\n{sections['workout_tips']}\n\n"
        f"[NUTRITION_TIPS]\n{sections['nutrition_tips']}"
    )

    # Delete any old daily coaching for today
    db.query(CoachInsight).filter(
        CoachInsight.user_id == current_user.id,
        CoachInsight.insight_date == today,
        CoachInsight.section == "daily_coaching",
    ).delete()

    new_coaching = CoachInsight(
        user_id=current_user.id,
        coach_type=coach_type,
        section="daily_coaching",
        insight=raw_text,
        insight_date=today,
    )
    db.add(new_coaching)
    db.commit()
    db.refresh(new_coaching)

    return DailyCoachingResponse(
        coach_name=coach["name"],
        coach_title=coach["title"],
        coach_type=coach_type,
        summary=sections["summary"],
        workout_tips=sections["workout_tips"],
        nutrition_tips=sections["nutrition_tips"],
        generated_at=new_coaching.created_at,
    )
