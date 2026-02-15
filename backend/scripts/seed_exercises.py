"""Seed home gym exercises into the database."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine
from app.models.exercise import Exercise
from sqlalchemy.orm import Session


def seed_exercises(db: Session):
    """Seed home gym exercises."""

    # Check if exercises already exist
    existing_count = db.query(Exercise).filter(Exercise.is_custom == False).count()
    if existing_count > 0:
        print(f"Exercises already seeded ({existing_count} found). Skipping.")
        return

    exercises = [
        # BARBELL EXERCISES
        # Squat Variations
        {"name": "Barbell Back Squat", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Front Squat", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Box Squat", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Pause Squat", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Barbell"},

        # Bench Press Variations
        {"name": "Barbell Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
        {"name": "Barbell Incline Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
        {"name": "Barbell Decline Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
        {"name": "Barbell Close-Grip Bench Press", "muscle_group": "Triceps", "equipment": "Barbell"},
        {"name": "Barbell Floor Press", "muscle_group": "Chest", "equipment": "Barbell"},

        # Deadlift Variations
        {"name": "Barbell Deadlift", "muscle_group": "Back", "equipment": "Barbell"},
        {"name": "Barbell Romanian Deadlift", "muscle_group": "Hamstrings", "equipment": "Barbell"},
        {"name": "Barbell Sumo Deadlift", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Rack Pull", "muscle_group": "Back", "equipment": "Barbell"},
        {"name": "Barbell Deficit Deadlift", "muscle_group": "Back", "equipment": "Barbell"},

        # Overhead Press
        {"name": "Barbell Overhead Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
        {"name": "Barbell Push Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
        {"name": "Barbell Seated Overhead Press", "muscle_group": "Shoulders", "equipment": "Barbell"},

        # Rows
        {"name": "Barbell Bent-Over Row", "muscle_group": "Back", "equipment": "Barbell"},
        {"name": "Barbell Pendlay Row", "muscle_group": "Back", "equipment": "Barbell"},
        {"name": "Barbell Underhand Row", "muscle_group": "Back", "equipment": "Barbell"},
        {"name": "Barbell Seal Row", "muscle_group": "Back", "equipment": "Barbell"},

        # Other Barbell
        {"name": "Barbell Lunge", "muscle_group": "Legs", "equipment": "Barbell"},
        {"name": "Barbell Hip Thrust", "muscle_group": "Glutes", "equipment": "Barbell"},
        {"name": "Barbell Good Morning", "muscle_group": "Hamstrings", "equipment": "Barbell"},
        {"name": "Barbell Shrug", "muscle_group": "Traps", "equipment": "Barbell"},
        {"name": "Barbell Curl", "muscle_group": "Biceps", "equipment": "Barbell"},
        {"name": "Barbell Skullcrusher", "muscle_group": "Triceps", "equipment": "Barbell"},

        # DUMBBELL EXERCISES
        # Chest
        {"name": "Dumbbell Bench Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
        {"name": "Dumbbell Incline Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
        {"name": "Dumbbell Decline Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
        {"name": "Dumbbell Fly", "muscle_group": "Chest", "equipment": "Dumbbell"},
        {"name": "Dumbbell Incline Fly", "muscle_group": "Chest", "equipment": "Dumbbell"},
        {"name": "Dumbbell Floor Press", "muscle_group": "Chest", "equipment": "Dumbbell"},

        # Shoulders
        {"name": "Dumbbell Overhead Press", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
        {"name": "Dumbbell Lateral Raise", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
        {"name": "Dumbbell Front Raise", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
        {"name": "Dumbbell Rear Delt Fly", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
        {"name": "Dumbbell Arnold Press", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
        {"name": "Dumbbell Upright Row", "muscle_group": "Shoulders", "equipment": "Dumbbell"},

        # Back
        {"name": "Dumbbell Row", "muscle_group": "Back", "equipment": "Dumbbell"},
        {"name": "Dumbbell Bent-Over Row", "muscle_group": "Back", "equipment": "Dumbbell"},
        {"name": "Dumbbell Single-Arm Row", "muscle_group": "Back", "equipment": "Dumbbell"},
        {"name": "Dumbbell Shrug", "muscle_group": "Traps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Pullover", "muscle_group": "Back", "equipment": "Dumbbell"},

        # Arms
        {"name": "Dumbbell Curl", "muscle_group": "Biceps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Hammer Curl", "muscle_group": "Biceps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Concentration Curl", "muscle_group": "Biceps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Overhead Triceps Extension", "muscle_group": "Triceps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Kickback", "muscle_group": "Triceps", "equipment": "Dumbbell"},
        {"name": "Dumbbell Skullcrusher", "muscle_group": "Triceps", "equipment": "Dumbbell"},

        # Legs
        {"name": "Dumbbell Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
        {"name": "Dumbbell Goblet Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
        {"name": "Dumbbell Lunge", "muscle_group": "Legs", "equipment": "Dumbbell"},
        {"name": "Dumbbell Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
        {"name": "Dumbbell Step-Up", "muscle_group": "Legs", "equipment": "Dumbbell"},
        {"name": "Dumbbell Romanian Deadlift", "muscle_group": "Hamstrings", "equipment": "Dumbbell"},
        {"name": "Dumbbell Calf Raise", "muscle_group": "Calves", "equipment": "Dumbbell"},

        # KETTLEBELL EXERCISES
        {"name": "Kettlebell Swing", "muscle_group": "Full Body", "equipment": "Kettlebell"},
        {"name": "Kettlebell Goblet Squat", "muscle_group": "Legs", "equipment": "Kettlebell"},
        {"name": "Kettlebell Turkish Get-Up", "muscle_group": "Full Body", "equipment": "Kettlebell"},
        {"name": "Kettlebell Snatch", "muscle_group": "Full Body", "equipment": "Kettlebell"},
        {"name": "Kettlebell Clean", "muscle_group": "Full Body", "equipment": "Kettlebell"},
        {"name": "Kettlebell Clean and Press", "muscle_group": "Full Body", "equipment": "Kettlebell"},
        {"name": "Kettlebell Row", "muscle_group": "Back", "equipment": "Kettlebell"},
        {"name": "Kettlebell Overhead Press", "muscle_group": "Shoulders", "equipment": "Kettlebell"},
        {"name": "Kettlebell Deadlift", "muscle_group": "Back", "equipment": "Kettlebell"},
        {"name": "Kettlebell Lunge", "muscle_group": "Legs", "equipment": "Kettlebell"},

        # BODYWEIGHT EXERCISES
        # Upper Body
        {"name": "Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
        {"name": "Chin-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
        {"name": "Wide-Grip Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
        {"name": "Neutral-Grip Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
        {"name": "Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
        {"name": "Wide-Grip Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
        {"name": "Diamond Push-Up", "muscle_group": "Triceps", "equipment": "Bodyweight"},
        {"name": "Decline Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
        {"name": "Dip", "muscle_group": "Chest", "equipment": "Bodyweight"},
        {"name": "Triceps Dip", "muscle_group": "Triceps", "equipment": "Bodyweight"},

        # Core
        {"name": "Plank", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Side Plank", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Hanging Leg Raise", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Hanging Knee Raise", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Ab Wheel Rollout", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Sit-Up", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Crunch", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Mountain Climber", "muscle_group": "Core", "equipment": "Bodyweight"},
        {"name": "Russian Twist", "muscle_group": "Core", "equipment": "Bodyweight"},

        # Lower Body
        {"name": "Bodyweight Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
        {"name": "Jump Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
        {"name": "Lunge", "muscle_group": "Legs", "equipment": "Bodyweight"},
        {"name": "Reverse Lunge", "muscle_group": "Legs", "equipment": "Bodyweight"},
        {"name": "Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
        {"name": "Single-Leg Deadlift", "muscle_group": "Hamstrings", "equipment": "Bodyweight"},
        {"name": "Glute Bridge", "muscle_group": "Glutes", "equipment": "Bodyweight"},
        {"name": "Single-Leg Glute Bridge", "muscle_group": "Glutes", "equipment": "Bodyweight"},
        {"name": "Calf Raise", "muscle_group": "Calves", "equipment": "Bodyweight"},

        # BENCH-SPECIFIC
        {"name": "Bench Hip Thrust", "muscle_group": "Glutes", "equipment": "Bench"},
        {"name": "Bench Step-Up", "muscle_group": "Legs", "equipment": "Bench"},
        {"name": "Bench Dip", "muscle_group": "Triceps", "equipment": "Bench"},
        {"name": "Incline Push-Up", "muscle_group": "Chest", "equipment": "Bench"},
        {"name": "Decline Push-Up (Feet on Bench)", "muscle_group": "Chest", "equipment": "Bench"},
        {"name": "Bulgarian Split Squat (Bench)", "muscle_group": "Legs", "equipment": "Bench"},

        # FULL BODY / CONDITIONING
        {"name": "Burpee", "muscle_group": "Full Body", "equipment": "Bodyweight"},
        {"name": "Jumping Jack", "muscle_group": "Cardio", "equipment": "Bodyweight"},
        {"name": "High Knee", "muscle_group": "Cardio", "equipment": "Bodyweight"},
        {"name": "Butt Kick", "muscle_group": "Cardio", "equipment": "Bodyweight"},
    ]

    # Add exercises to database
    for ex_data in exercises:
        exercise = Exercise(**ex_data, is_custom=False, user_id=None)
        db.add(exercise)

    db.commit()
    print(f"Successfully seeded {len(exercises)} exercises!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_exercises(db)
    finally:
        db.close()
