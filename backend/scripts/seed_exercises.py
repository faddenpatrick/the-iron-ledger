"""Seed exercise database with comprehensive home gym exercises."""
import uuid
from datetime import datetime, timezone
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
    {"name": "Barbell Tricep Extension", "muscle_group": "Arms", "equipment": "Barbell"},
    {"name": "Barbell Preacher Curl", "muscle_group": "Arms", "equipment": "Barbell"},

    # Full Body / Olympic
    {"name": "Barbell Clean and Press", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Clean", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Power Clean", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Hang Clean", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Snatch", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Thruster", "muscle_group": "Full Body", "equipment": "Barbell"},
    {"name": "Barbell Clean and Jerk", "muscle_group": "Full Body", "equipment": "Barbell"},

    # Core
    {"name": "Barbell Landmine Rotation", "muscle_group": "Core", "equipment": "Barbell"},
    {"name": "Barbell Rollout", "muscle_group": "Core", "equipment": "Barbell"},

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
    {"name": "Dumbbell Incline Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Spider Curl", "muscle_group": "Arms", "equipment": "Dumbbell"},
    {"name": "Dumbbell Skullcrusher", "muscle_group": "Arms", "equipment": "Dumbbell"},

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

    # ===== CABLE / BAND EXERCISES (25) =====
    # Shoulders
    {"name": "Face Pull", "muscle_group": "Shoulders", "equipment": "Cable"},
    {"name": "Cable Lateral Raise", "muscle_group": "Shoulders", "equipment": "Cable"},
    {"name": "Cable Front Raise", "muscle_group": "Shoulders", "equipment": "Cable"},
    {"name": "Cable Rear Delt Fly", "muscle_group": "Shoulders", "equipment": "Cable"},
    {"name": "Cable Upright Row", "muscle_group": "Shoulders", "equipment": "Cable"},

    # Arms
    {"name": "Cable Tricep Pushdown", "muscle_group": "Arms", "equipment": "Cable"},
    {"name": "Cable Overhead Tricep Extension", "muscle_group": "Arms", "equipment": "Cable"},
    {"name": "Cable Curl", "muscle_group": "Arms", "equipment": "Cable"},
    {"name": "Cable Hammer Curl", "muscle_group": "Arms", "equipment": "Cable"},
    {"name": "Cable Reverse Curl", "muscle_group": "Arms", "equipment": "Cable"},

    # Chest
    {"name": "Cable Fly", "muscle_group": "Chest", "equipment": "Cable"},
    {"name": "Cable Crossover", "muscle_group": "Chest", "equipment": "Cable"},
    {"name": "Cable Low-to-High Fly", "muscle_group": "Chest", "equipment": "Cable"},

    # Back
    {"name": "Cable Row", "muscle_group": "Back", "equipment": "Cable"},
    {"name": "Cable Lat Pulldown", "muscle_group": "Back", "equipment": "Cable"},
    {"name": "Cable Straight-Arm Pulldown", "muscle_group": "Back", "equipment": "Cable"},
    {"name": "Cable Close-Grip Row", "muscle_group": "Back", "equipment": "Cable"},
    {"name": "Cable Single-Arm Row", "muscle_group": "Back", "equipment": "Cable"},

    # Core
    {"name": "Cable Woodchop", "muscle_group": "Core", "equipment": "Cable"},
    {"name": "Cable Pallof Press", "muscle_group": "Core", "equipment": "Cable"},
    {"name": "Cable Crunch", "muscle_group": "Core", "equipment": "Cable"},

    # Legs
    {"name": "Cable Pull-Through", "muscle_group": "Legs", "equipment": "Cable"},
    {"name": "Cable Kickback", "muscle_group": "Legs", "equipment": "Cable"},
    {"name": "Cable Hip Abduction", "muscle_group": "Legs", "equipment": "Cable"},
    {"name": "Cable Hip Adduction", "muscle_group": "Legs", "equipment": "Cable"},

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
    {"name": "Bear Crawl", "muscle_group": "Full Body", "equipment": "Bodyweight"},
    {"name": "Dead Hang", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Muscle-Up", "muscle_group": "Full Body", "equipment": "Bodyweight"},
    {"name": "L-Sit", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Toes to Bar", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Reverse Crunch", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "V-Up", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Dragon Flag", "muscle_group": "Core", "equipment": "Bodyweight"},
    {"name": "Superman", "muscle_group": "Back", "equipment": "Bodyweight"},
    {"name": "Hip Raise", "muscle_group": "Legs", "equipment": "Bodyweight"},

    # ===== MACHINE EXERCISES (20) =====
    # Chest
    {"name": "Machine Chest Press", "muscle_group": "Chest", "equipment": "Machine"},
    {"name": "Machine Pec Fly", "muscle_group": "Chest", "equipment": "Machine"},

    # Back
    {"name": "Machine Lat Pulldown", "muscle_group": "Back", "equipment": "Machine"},
    {"name": "Machine Seated Row", "muscle_group": "Back", "equipment": "Machine"},
    {"name": "Machine Assisted Pull-Up", "muscle_group": "Back", "equipment": "Machine"},

    # Legs
    {"name": "Leg Press", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Leg Extension", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Leg Curl", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Seated Calf Raise", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Hack Squat", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Hip Abductor Machine", "muscle_group": "Legs", "equipment": "Machine"},
    {"name": "Hip Adductor Machine", "muscle_group": "Legs", "equipment": "Machine"},

    # Shoulders
    {"name": "Machine Shoulder Press", "muscle_group": "Shoulders", "equipment": "Machine"},
    {"name": "Machine Lateral Raise", "muscle_group": "Shoulders", "equipment": "Machine"},
    {"name": "Machine Reverse Fly", "muscle_group": "Shoulders", "equipment": "Machine"},

    # Arms
    {"name": "Machine Preacher Curl", "muscle_group": "Arms", "equipment": "Machine"},
    {"name": "Machine Tricep Dip", "muscle_group": "Arms", "equipment": "Machine"},

    # Core
    {"name": "Machine Ab Crunch", "muscle_group": "Core", "equipment": "Machine"},
    {"name": "Machine Back Extension", "muscle_group": "Back", "equipment": "Machine"},
    {"name": "Machine Torso Rotation", "muscle_group": "Core", "equipment": "Machine"},
]


def seed_exercises(db: Session):
    """Seed exercise database with comprehensive gym exercises.

    Supports incremental seeding — adds any new exercises from the list
    that don't already exist in the database.
    """

    # Get existing system exercise names for deduplication
    existing_names = set(
        name for (name,) in db.query(Exercise.name).filter(
            Exercise.is_custom == False
        ).all()
    )

    # Find new exercises to add
    new_exercises = [e for e in EXERCISES if e["name"] not in existing_names]

    if not new_exercises and existing_names:
        print(f"✓ Exercises already seeded ({len(existing_names)} system exercises found)")
        return

    if existing_names:
        print(f"Found {len(new_exercises)} new exercises to add (existing: {len(existing_names)})")
    else:
        print(f"Seeding {len(EXERCISES)} exercises...")

    now = datetime.now(timezone.utc)
    for exercise_data in new_exercises:
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
        total = len(existing_names) + len(new_exercises)
        if existing_names:
            print(f"✓ Added {len(new_exercises)} new exercises (total: {total})")
        else:
            print(f"✓ Successfully seeded {len(new_exercises)} exercises!")

        # Count by equipment
        from collections import Counter
        counts = Counter(e.get("equipment", "Unknown") for e in EXERCISES)
        for equip, count in sorted(counts.items()):
            print(f"  - {equip}: {count}")
    except Exception as e:
        db.rollback()
        print(f"✗ Failed to seed exercises: {e}")
        raise
