"""Seed common foods into the database."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models.nutrition import Food
from sqlalchemy.orm import Session


def seed_foods(db: Session):
    """Seed common foods."""

    # Check if foods already exist
    existing_count = db.query(Food).filter(Food.is_custom == False).count()
    if existing_count > 0:
        print(f"Foods already seeded ({existing_count} found). Skipping.")
        return

    foods = [
        # PROTEINS - Meat & Poultry
        {"name": "Chicken Breast, Raw", "serving_size": "100g", "calories": 165, "protein": 31, "carbs": 0, "fat": 4},
        {"name": "Chicken Breast, Cooked", "serving_size": "100g", "calories": 195, "protein": 29, "carbs": 0, "fat": 8},
        {"name": "Chicken Thigh, Raw", "serving_size": "100g", "calories": 209, "protein": 18, "carbs": 0, "fat": 15},
        {"name": "Ground Beef, 93% Lean", "serving_size": "100g", "calories": 152, "protein": 21, "carbs": 0, "fat": 7},
        {"name": "Ground Beef, 80% Lean", "serving_size": "100g", "calories": 254, "protein": 17, "carbs": 0, "fat": 20},
        {"name": "Sirloin Steak", "serving_size": "100g", "calories": 206, "protein": 27, "carbs": 0, "fat": 10},
        {"name": "Pork Chop", "serving_size": "100g", "calories": 231, "protein": 25, "carbs": 0, "fat": 14},
        {"name": "Turkey Breast", "serving_size": "100g", "calories": 135, "protein": 30, "carbs": 0, "fat": 1},
        {"name": "Ground Turkey, Lean", "serving_size": "100g", "calories": 149, "protein": 20, "carbs": 0, "fat": 8},
        {"name": "Bacon", "serving_size": "3 slices (25g)", "calories": 133, "protein": 9, "carbs": 0, "fat": 10},

        # PROTEINS - Fish & Seafood
        {"name": "Salmon, Raw", "serving_size": "100g", "calories": 208, "protein": 20, "carbs": 0, "fat": 13},
        {"name": "Salmon, Cooked", "serving_size": "100g", "calories": 206, "protein": 22, "carbs": 0, "fat": 12},
        {"name": "Tuna, Canned in Water", "serving_size": "100g", "calories": 116, "protein": 26, "carbs": 0, "fat": 1},
        {"name": "Tilapia", "serving_size": "100g", "calories": 96, "protein": 20, "carbs": 0, "fat": 2},
        {"name": "Cod", "serving_size": "100g", "calories": 82, "protein": 18, "carbs": 0, "fat": 1},
        {"name": "Shrimp", "serving_size": "100g", "calories": 99, "protein": 24, "carbs": 0, "fat": 0},

        # PROTEINS - Eggs & Dairy
        {"name": "Whole Egg, Large", "serving_size": "1 egg (50g)", "calories": 72, "protein": 6, "carbs": 0, "fat": 5},
        {"name": "Egg Whites", "serving_size": "100g", "calories": 52, "protein": 11, "carbs": 1, "fat": 0},
        {"name": "Greek Yogurt, Nonfat", "serving_size": "170g", "calories": 100, "protein": 17, "carbs": 7, "fat": 0},
        {"name": "Greek Yogurt, Full Fat", "serving_size": "170g", "calories": 190, "protein": 10, "carbs": 8, "fat": 13},
        {"name": "Cottage Cheese, Low Fat", "serving_size": "100g", "calories": 72, "protein": 12, "carbs": 4, "fat": 1},
        {"name": "Cheddar Cheese", "serving_size": "28g", "calories": 114, "protein": 7, "carbs": 0, "fat": 9},
        {"name": "Mozzarella Cheese", "serving_size": "28g", "calories": 85, "protein": 6, "carbs": 1, "fat": 6},
        {"name": "Milk, Whole", "serving_size": "1 cup (244g)", "calories": 149, "protein": 8, "carbs": 12, "fat": 8},
        {"name": "Milk, 2%", "serving_size": "1 cup (244g)", "calories": 122, "protein": 8, "carbs": 12, "fat": 5},
        {"name": "Milk, Skim", "serving_size": "1 cup (244g)", "calories": 83, "protein": 8, "carbs": 12, "fat": 0},

        # PROTEINS - Plant-Based
        {"name": "Tofu, Firm", "serving_size": "100g", "calories": 144, "protein": 17, "carbs": 3, "fat": 9},
        {"name": "Tempeh", "serving_size": "100g", "calories": 193, "protein": 20, "carbs": 9, "fat": 11},
        {"name": "Black Beans, Cooked", "serving_size": "100g", "calories": 132, "protein": 9, "carbs": 24, "fat": 1},
        {"name": "Chickpeas, Cooked", "serving_size": "100g", "calories": 164, "protein": 9, "carbs": 27, "fat": 3},
        {"name": "Lentils, Cooked", "serving_size": "100g", "calories": 116, "protein": 9, "carbs": 20, "fat": 0},
        {"name": "Peanut Butter", "serving_size": "2 tbsp (32g)", "calories": 188, "protein": 8, "carbs": 7, "fat": 16},
        {"name": "Almond Butter", "serving_size": "2 tbsp (32g)", "calories": 196, "protein": 7, "carbs": 6, "fat": 18},
        {"name": "Almonds", "serving_size": "28g", "calories": 164, "protein": 6, "carbs": 6, "fat": 14},
        {"name": "Cashews", "serving_size": "28g", "calories": 157, "protein": 5, "carbs": 9, "fat": 12},
        {"name": "Walnuts", "serving_size": "28g", "calories": 185, "protein": 4, "carbs": 4, "fat": 18},

        # CARBS - Grains & Bread
        {"name": "White Rice, Cooked", "serving_size": "100g", "calories": 130, "protein": 3, "carbs": 28, "fat": 0},
        {"name": "Brown Rice, Cooked", "serving_size": "100g", "calories": 112, "protein": 3, "carbs": 24, "fat": 1},
        {"name": "Quinoa, Cooked", "serving_size": "100g", "calories": 120, "protein": 4, "carbs": 21, "fat": 2},
        {"name": "Oatmeal, Cooked", "serving_size": "100g", "calories": 71, "protein": 3, "carbs": 12, "fat": 1},
        {"name": "Oats, Dry", "serving_size": "40g", "calories": 148, "protein": 5, "carbs": 27, "fat": 3},
        {"name": "Pasta, Cooked", "serving_size": "100g", "calories": 131, "protein": 5, "carbs": 25, "fat": 1},
        {"name": "Whole Wheat Bread", "serving_size": "1 slice (28g)", "calories": 69, "protein": 4, "carbs": 12, "fat": 1},
        {"name": "White Bread", "serving_size": "1 slice (28g)", "calories": 75, "protein": 2, "carbs": 14, "fat": 1},
        {"name": "Bagel", "serving_size": "1 medium (95g)", "calories": 257, "protein": 10, "carbs": 50, "fat": 2},
        {"name": "English Muffin", "serving_size": "1 muffin (57g)", "calories": 134, "protein": 5, "carbs": 26, "fat": 1},
        {"name": "Tortilla, Flour", "serving_size": "1 medium (46g)", "calories": 146, "protein": 4, "carbs": 24, "fat": 4},

        # CARBS - Potatoes & Vegetables
        {"name": "Potato, Baked with Skin", "serving_size": "1 medium (173g)", "calories": 161, "protein": 4, "carbs": 37, "fat": 0},
        {"name": "Sweet Potato, Baked", "serving_size": "1 medium (114g)", "calories": 103, "protein": 2, "carbs": 24, "fat": 0},
        {"name": "Broccoli, Cooked", "serving_size": "100g", "calories": 35, "protein": 2, "carbs": 7, "fat": 0},
        {"name": "Spinach, Raw", "serving_size": "100g", "calories": 23, "protein": 3, "carbs": 4, "fat": 0},
        {"name": "Carrots, Raw", "serving_size": "100g", "calories": 41, "protein": 1, "carbs": 10, "fat": 0},
        {"name": "Bell Pepper", "serving_size": "100g", "calories": 31, "protein": 1, "carbs": 6, "fat": 0},
        {"name": "Tomato", "serving_size": "1 medium (123g)", "calories": 22, "protein": 1, "carbs": 5, "fat": 0},
        {"name": "Cucumber", "serving_size": "100g", "calories": 16, "protein": 1, "carbs": 4, "fat": 0},
        {"name": "Lettuce, Romaine", "serving_size": "100g", "calories": 17, "protein": 1, "carbs": 3, "fat": 0},
        {"name": "Onion", "serving_size": "100g", "calories": 40, "protein": 1, "carbs": 9, "fat": 0},

        # FRUITS
        {"name": "Banana, Medium", "serving_size": "1 medium (118g)", "calories": 105, "protein": 1, "carbs": 27, "fat": 0},
        {"name": "Apple, Medium", "serving_size": "1 medium (182g)", "calories": 95, "protein": 0, "carbs": 25, "fat": 0},
        {"name": "Orange", "serving_size": "1 medium (131g)", "calories": 62, "protein": 1, "carbs": 15, "fat": 0},
        {"name": "Strawberries", "serving_size": "100g", "calories": 32, "protein": 1, "carbs": 8, "fat": 0},
        {"name": "Blueberries", "serving_size": "100g", "calories": 57, "protein": 1, "carbs": 14, "fat": 0},
        {"name": "Grapes", "serving_size": "100g", "calories": 69, "protein": 1, "carbs": 18, "fat": 0},
        {"name": "Avocado", "serving_size": "1/2 medium (68g)", "calories": 114, "protein": 1, "carbs": 6, "fat": 11},

        # FATS & OILS
        {"name": "Olive Oil", "serving_size": "1 tbsp (14g)", "calories": 119, "protein": 0, "carbs": 0, "fat": 14},
        {"name": "Coconut Oil", "serving_size": "1 tbsp (14g)", "calories": 121, "protein": 0, "carbs": 0, "fat": 14},
        {"name": "Butter", "serving_size": "1 tbsp (14g)", "calories": 102, "protein": 0, "carbs": 0, "fat": 12},
        {"name": "Mayonnaise", "serving_size": "1 tbsp (14g)", "calories": 94, "protein": 0, "carbs": 0, "fat": 10},

        # PROTEIN SUPPLEMENTS
        {"name": "Whey Protein Powder", "serving_size": "1 scoop (30g)", "calories": 120, "protein": 24, "carbs": 3, "fat": 2},
        {"name": "Plant Protein Powder", "serving_size": "1 scoop (30g)", "calories": 110, "protein": 20, "carbs": 5, "fat": 2},

        # SNACKS
        {"name": "Protein Bar", "serving_size": "1 bar (60g)", "calories": 200, "protein": 20, "carbs": 22, "fat": 7},
        {"name": "Granola Bar", "serving_size": "1 bar (28g)", "calories": 120, "protein": 2, "carbs": 20, "fat": 4},
        {"name": "Rice Cakes", "serving_size": "1 cake (9g)", "calories": 35, "protein": 1, "carbs": 7, "fat": 0},
    ]

    print(f"Seeding {len(foods)} foods...")

    for food_data in foods:
        food = Food(
            **food_data,
            is_custom=False,
            user_id=None  # System foods have no user
        )
        db.add(food)

    db.commit()
    print(f"✓ Successfully seeded {len(foods)} foods")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_foods(db)
    finally:
        db.close()
