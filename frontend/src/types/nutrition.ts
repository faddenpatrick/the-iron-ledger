export interface MealCategory {
  id: string;
  user_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  food_name_snapshot: string;
  calories_snapshot: number;
  protein_snapshot: number;
  carbs_snapshot: number;
  fat_snapshot: number;
  servings: number;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  category_id: string;
  category_name_snapshot: string;
  meal_date: string;
  meal_time: string;
  created_at: string;
  updated_at: string;
  items: MealItem[];
}

export interface MealList {
  id: string;
  user_id: string;
  category_id: string;
  category_name_snapshot: string;
  meal_date: string;
  meal_time: string;
  created_at: string;
}

export interface NutritionSummary {
  date: string;
  is_cheat_day: boolean;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
}

export interface WeeklySummary {
  start_date: string;
  end_date: string;
  days_with_data: number;
  cheat_day_count: number;
  cheat_dates: string[];
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
}

export interface CreateMealCategoryRequest {
  name: string;
  display_order?: number;
}

export interface CreateFoodRequest {
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CreateMealRequest {
  category_id: string;
  meal_date: string;
  meal_time: string;
  items: {
    food_id: string;
    servings: number;
  }[];
}
