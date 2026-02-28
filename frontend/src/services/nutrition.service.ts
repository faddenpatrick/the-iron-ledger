import api from './api';
import { db, addToSyncQueue } from './indexeddb.service';
import { generateUUID } from '../utils/uuid';
import {
  MealCategory,
  Food,
  Meal,
  MealList,
  NutritionSummary,
  WeeklySummary,
  CreateMealCategoryRequest,
  CreateFoodRequest,
  CreateMealRequest,
} from '../types/nutrition';

// Meal Categories
export const getMealCategories = async (): Promise<MealCategory[]> => {
  // IndexedDB first
  const categories = await db.mealCategories.toArray();

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/nutrition/meal-categories');
      const apiCategories = response.data;
      await db.mealCategories.bulkPut(apiCategories);
      return apiCategories;
    } catch (error) {
      console.error('Failed to fetch meal categories from API:', error);
    }
  }

  return categories;
};

export const createMealCategory = async (
  data: CreateMealCategoryRequest
): Promise<MealCategory> => {
  const tempId = generateUUID();
  const now = new Date().toISOString();
  const category: MealCategory = {
    id: tempId,
    user_id: '',
    name: data.name,
    display_order: data.display_order || 0,
    created_at: now,
    updated_at: now,
  };

  // Save to IndexedDB immediately
  await db.mealCategories.add(category);

  // Sync with server
  if (navigator.onLine) {
    try {
      const response = await api.post('/nutrition/meal-categories', data);
      const serverCategory = response.data;
      await db.mealCategories.delete(tempId);
      await db.mealCategories.add(serverCategory);
      return serverCategory;
    } catch (error) {
      console.error('Failed to create meal category on server:', error);
      await addToSyncQueue({
        method: 'POST',
        endpoint: '/nutrition/meal-categories',
        data,
        entityType: 'mealCategory',
        entityId: tempId,
      });
      return category;
    }
  } else {
    await addToSyncQueue({
      method: 'POST',
      endpoint: '/nutrition/meal-categories',
      data,
      entityType: 'mealCategory',
      entityId: tempId,
    });
    return category;
  }
};

export const updateMealCategory = async (
  id: string,
  data: { name?: string; display_order?: number }
): Promise<MealCategory> => {
  const response = await api.put(`/nutrition/meal-categories/${id}`, data);
  return response.data;
};

export const deleteMealCategory = async (id: string): Promise<void> => {
  await api.delete(`/nutrition/meal-categories/${id}`);
};

// Foods
export const getFoods = async (search?: string): Promise<Food[]> => {
  // IndexedDB first
  let foods = await db.foods.toArray();

  // Apply search filter if specified
  if (search) {
    const searchLower = search.toLowerCase();
    foods = foods.filter((f) => f.name.toLowerCase().includes(searchLower));
  }

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/nutrition/foods', {
        params: { search },
      });
      const apiFoods = response.data.items || response.data;
      await db.foods.bulkPut(apiFoods);
      return apiFoods;
    } catch (error) {
      console.error('Failed to fetch foods from API:', error);
    }
  }

  return foods;
};

export const createFood = async (data: CreateFoodRequest): Promise<Food> => {
  const response = await api.post('/nutrition/foods', data);
  return response.data;
};

export const updateFood = async (
  id: string,
  data: Partial<CreateFoodRequest>
): Promise<Food> => {
  const response = await api.put(`/nutrition/foods/${id}`, data);
  return response.data;
};

export const deleteFood = async (id: string): Promise<void> => {
  await api.delete(`/nutrition/foods/${id}`);
};

// Meals
export const getMeals = async (meal_date?: string): Promise<MealList[]> => {
  // IndexedDB first
  let meals = await db.meals.toArray();

  if (meal_date) {
    meals = meals.filter((m) => m.meal_date === meal_date);
  }

  // Sort by meal_time
  meals.sort((a, b) => (a.meal_time || '').localeCompare(b.meal_time || ''));

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/nutrition/meals', {
        params: { meal_date },
      });
      const apiMeals = response.data;
      if (apiMeals.length > 0) {
        await db.meals.bulkPut(apiMeals);
      }
      return apiMeals;
    } catch (error) {
      console.error('Failed to fetch meals from API:', error);
    }
  }

  return meals as unknown as MealList[];
};

export const getMeal = async (id: string): Promise<Meal> => {
  const response = await api.get(`/nutrition/meals/${id}`);
  return response.data;
};

export const createMeal = async (data: CreateMealRequest): Promise<Meal> => {
  const tempId = generateUUID();
  const now = new Date().toISOString();

  const meal: Meal = {
    id: tempId,
    user_id: '',
    category_id: data.category_id,
    category_name_snapshot: '', // Will be set from category
    meal_date: data.meal_date,
    meal_time: data.meal_time,
    created_at: now,
    updated_at: now,
    items: data.items.map((item) => ({
      id: generateUUID(),
      meal_id: tempId,
      food_id: item.food_id,
      food_name_snapshot: '',
      calories_snapshot: 0,
      protein_snapshot: 0,
      carbs_snapshot: 0,
      fat_snapshot: 0,
      servings: item.servings,
      created_at: now,
    })),
  };

  // Save to IndexedDB immediately
  await db.meals.add(meal);
  for (const item of meal.items) {
    await db.mealItems.add(item);
  }

  // Sync with server
  if (navigator.onLine) {
    try {
      const response = await api.post('/nutrition/meals', data);
      const serverMeal = response.data;
      // Replace temp meal with server version
      await db.meals.delete(tempId);
      await db.meals.add(serverMeal);
      // Replace temp meal items
      for (const item of meal.items) {
        await db.mealItems.delete(item.id);
      }
      if (serverMeal.items) {
        for (const item of serverMeal.items) {
          await db.mealItems.add(item);
        }
      }
      return serverMeal;
    } catch (error) {
      console.error('Failed to create meal on server:', error);
      await addToSyncQueue({
        method: 'POST',
        endpoint: '/nutrition/meals',
        data,
        entityType: 'meal',
        entityId: tempId,
      });
      return meal;
    }
  } else {
    await addToSyncQueue({
      method: 'POST',
      endpoint: '/nutrition/meals',
      data,
      entityType: 'meal',
      entityId: tempId,
    });
    return meal;
  }
};

export const deleteMeal = async (id: string): Promise<void> => {
  await api.delete(`/nutrition/meals/${id}`);
};

export const deleteMealItem = async (id: string): Promise<void> => {
  await api.delete(`/nutrition/meal-items/${id}`);
};

export const updateMealItemServings = async (
  itemId: string,
  servings: number
): Promise<void> => {
  await api.patch(`/nutrition/meal-items/${itemId}`, { servings });
};

export const addMealItem = async (
  mealId: string,
  foodId: string,
  servings: number
): Promise<void> => {
  await api.post(`/nutrition/meals/${mealId}/items`, {
    food_id: foodId,
    servings: servings,
  });
};

export const copyMeal = async (
  mealId: string,
  newMealDate: string,
  newMealTime: string
): Promise<Meal> => {
  const response = await api.post(`/nutrition/meals/${mealId}/copy`, {
    meal_date: newMealDate,
    meal_time: newMealTime,
  });
  return response.data;
};

// Nutrition Summary
export const getNutritionSummary = async (
  date: string
): Promise<NutritionSummary> => {
  // Check IndexedDB cache first
  const cached = await db.nutritionSummaries.get(date);

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/nutrition/summary', {
        params: { summary_date: date },
      });
      const summary = response.data;
      // Cache in IndexedDB
      await db.nutritionSummaries.put({ ...summary, date });
      return summary;
    } catch (error) {
      console.error('Failed to fetch nutrition summary from API:', error);
      if (cached) return cached;
      throw error;
    }
  }

  if (cached) return cached;
  throw new Error('No cached nutrition summary and offline');
};

// Weekly Summary
export const getWeeklySummary = async (
  endDate: string
): Promise<WeeklySummary> => {
  const response = await api.get('/nutrition/weekly-average', {
    params: { end_date: endDate },
  });
  return response.data;
};
