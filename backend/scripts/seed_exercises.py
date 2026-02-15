"""Seed exercise database with comprehensive home gym exercises."""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.exercise import Exercise


EXERCISES = [
    # ===== BARBELL EXERCISES (30) =====
    # Chest
    {"name": "Barbell Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
    {"name": "Barbell Incline Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
    {"name": "Barbell Decline Bench Press", "muscle_group": "Chest", "equipment": "Barbell"},
    {"name": "Barbell Floor Press", "muscle_group": "Chest", "equipment": "Barbell"},

    # Back
    {"name": "Barbell Row", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Barbell Pendlay Row", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Barbell T-Bar Row", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Barbell Deadlift", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Barbell Rack Pull", "muscle_group": "Back", "equipment": "Barbell"},
    {"name": "Barbell Seal Row", "muscle_group": "Back", "equipment": "Barbell"},

    # Legs
    {"name": "Barbell Back Squat", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Front Squat", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Overhead Squat", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Romanian Deadlift", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Sumo Deadlift", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Lunge", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Split Squat", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Hip Thrust", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Good Morning", "muscle_group": "Legs", "equipment": "Barbell"},
    {"name": "Barbell Calf Raise", "muscle_group": "Legs", "equipment": "Barbell"},

    # Shoulders
    {"name": "Barbell Overhead Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Barbell Push Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Barbell Bradford Press", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Barbell Upright Row", "muscle_group": "Shoulders", "equipment": "Barbell"},
    {"name": "Barbell Shrug", "muscle_group": "Shoulders", "equipment": "Barbell"},

    # Arms
    {"name": "Barbell Curl", "muscle_group": "Arms", "equipment": "Barbell"},
    {"name": "Barbell Close-Grip Bench Press", "muscle_group": "Arms", "equipment": "Barbell"},
    {"name": "Barbell Skull Crusher", "muscle_group": "Arms", "equipment": "Barbell"},
    {"name": "Barbell Reverse Curl", "muscle_group": "Arms", "equipment": "Barbell"},
    {"name": "Barbell Wrist Curl", "muscle_group": "Arms", "equipment": "Barbell"},

    # ===== DUMBBELL EXERCISES (35) =====
    # Chest
    {"name": "Dumbbell Bench Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Incline Bench Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Decline Bench Press", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Fly", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Incline Fly", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Pullover", "muscle_group": "Chest", "equipment": "Dumbbell"},
    {"name": "Dumbbell Floor Press", "muscle_group": "Chest", "equipment": "Dumbbell"},

    # Back
    {"name": "Dumbbell Row", "muscle_group": "Back", "equipment": "Dumbbell"},
    {"name": "Dumbbell Single-Arm Row", "muscle_group": "Back", "equipment": "Dumbbell"},
    {"name": "Dumbbell Renegade Row", "muscle_group": "Back", "equipment": "Dumbbell"},
    {"name": "Dumbbell Chest-Supported Row", "muscle_group": "Back", "equipment": "Dumbbell"},

    # Legs
    {"name": "Dumbbell Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Goblet Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Lunge", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Reverse Lunge", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Walking Lunge", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Romanian Deadlift", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Single-Leg RDL", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Step-Up", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Dumbbell"},
    {"name": "Dumbbell Calf Raise", "muscle_group": "Legs", "equipment": "Dumbbell"},

    # Shoulders
    {"name": "Dumbbell Shoulder Press", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
    {"name": "Dumbbell Arnold Press", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
    {"name": "Dumbbell Lateral Raise", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
    {"name": "Dumbbell Front Raise", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
    {"name": "Dumbbell Rear Delt Fly", "muscle_group": "Shoulders", "equipment": "Dumbbell"},
    {"name": "Dumbbell Shrug", "muscle_group": "Shoulders", "equipment": "Dumbbell"},

    # Arms
    {"name": "Dumbbell Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Hammer Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Concentration Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Overhead Extension", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Kickback", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Wrist Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},

    # Core
    {"name": "Dumbbell Russian Twist", "muscle_group": "Core", "equipment": "Dumbbell"},
    {"name": "Dumbbell Side Bend", "muscle_group": "Core", "equipment": "Dumbbell"},

    # ===== KETTLEBELL EXERCISES (20) =====
    # Full Body
    {"name": "Kettlebell Swing", "muscle_group": "Full Body", "equipment": "Kettlebell"},
    {"name": "Kettlebell Clean", "muscle_group": "Full Body", "equipment": "Kettlebell"},
    {"name": "Kettlebell Snatch", "muscle_group": "Full Body", "equipment": "Kettlebell"},
    {"name": "Kettlebell Turkish Get-Up", "muscle_group": "Full Body", "equipment": "Kettlebell"},
    {"name": "Kettlebell Thruster", "muscle_group": "Full Body", "equipment": "Kettlebell"},

    # Legs
    {"name": "Kettlebell Goblet Squat", "muscle_group": "Legs", "equipment": "Kettlebell"},
    {"name": "Kettlebell Lunge", "muscle_group": "Legs", "equipment": "Kettlebell"},
    {"name": "Kettlebell Single-Leg RDL", "muscle_group": "Legs", "equipment": "Kettlebell"},
    {"name": "Kettlebell Deadlift", "muscle_group": "Legs", "equipment": "Kettlebell"},

    # Shoulders
    {"name": "Kettlebell Press", "muscle_group": "Shoulders", "equipment": "Kettlebell"},
    {"name": "Kettlebell High Pull", "muscle_group": "Shoulders", "equipment": "Kettlebell"},
    {"name": "Kettlebell Halo", "muscle_group": "Shoulders", "equipment": "Kettlebell"},

    # Back
    {"name": "Kettlebell Row", "muscle_group": "Back", "equipment": "Kettlebell"},

    # Core
    {"name": "Kettlebell Windmill", "muscle_group": "Core", "equipment": "Kettlebell"},
    {"name": "Kettlebell Russian Twist", "muscle_group": "Core", "equipment": "Kettlebell"},

    # Arms
    {"name": "Kettlebell Curl", "muscle_group": "Arms", "equipment": "Kettlebell"},
    {"name": "Kettlebell Overhead Extension", "muscle_group": "Arms", "equipment": "Kettlebell"},

    # Chest
    {"name": "Kettlebell Floor Press", "muscle_group": "Chest", "equipment": "Kettlebell"},
    {"name": "Kettlebell Push-Up", "muscle_group": "Chest", "equipment": "Kettlebell"},
    {"name": "Kettlebell Fly", "muscle_group": "Chest", "equipment": "Kettlebell"},

    # ===== BODYWEIGHT EXERCISES (35) =====
    # Chest
    {"name": "Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Wide Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Diamond Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Decline Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Archer Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},
    {"name": "Pike Push-Up", "muscle_group": "Chest", "equipment": "Bodyweight"},

    # Back
    {"name": "Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Chin-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Neutral Grip Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Wide Grip Pull-Up", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Inverted Row", "muscle_group": "Back", "equipment": "Bodyweight"},

    # Legs
    {"name": "Bodyweight Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Jump Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Pistol Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Nordic Curl", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Bodyweight Lunge", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Walking Lunge", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Bulgarian Split Squat", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Glute Bridge", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Single-Leg Glute Bridge", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Calf Raise", "muscle_group": "Legs", "equipment": "Bodyweight"},

    # Shoulders
    {"name": "Handstand Push-Up", "muscle_group": "Shoulders", "equipment": "Bodyweight"},

    # Core
    {"name": "Plank", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Side Plank", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Ab Wheel Rollout", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Hanging Knee Raise", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Hanging Leg Raise", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Mountain Climber", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Bicycle Crunch", "muscle_group": "Core", "equipment": "Bodyweight"},

    # Arms
    {"name": "Dip", "muscle_group": "Arms", "equipment": "Bodyweight"},
    {"name": "Bench Dip", "muscle_group": "Arms", "equipment": "Bodyweight"},

    # Full Body
    {"name": "Burpee", "muscle_group": "Full Body", "equipment": "Bodyweight"},
    {"name": "Jump Lunge", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Box Jump", "muscle_group": "Legs", "equipment": "Bodyweight"},
    {"name": "Wall Sit", "muscle_group": "Legs", "equipment": "Bodyweight"},
]


def seed_exercises(db: Session):
    """Seed exercise database with comprehensive home gym exercises."""

    # Check if exercises already exist
    existing_count = db.query(Exercise).filter(Exercise.is_custom == False).count()
    if existing_count > 0:
        print(f"✓ Exercises already seeded ({existing_count} system exercises found)")
        return

    print(f"Seeding {len(EXERCISES)} exercises...")

    now = datetime.utcnow()
    for exercise_data in EXERCISES:
        exercise = Exercise(
            id=uuid.uuid4(),
            name=exercise_data["name"],
            muscle_group=exercise_data.get("muscle_group"),
            equipment=exercise_data.get("equipment"),
            is_custom=False,
            user_id=None,  # System exercise
            created_at=now,
            updated_at=now,
            deleted_at=None
        )
        db.add(exercise)

    try:
        db.commit()
        print(f"✓ Successfully seeded {len(EXERCISES)} exercises!")
        print(f"  - Barbell: 30")
        print(f"  - Dumbbell: 35")
        print(f"  - Kettlebell: 20")
        print(f"  - Bodyweight: 35")
    except Exception as e:
        db.rollback()
        print(f"✗ Failed to seed exercises: {e}")
        raise
