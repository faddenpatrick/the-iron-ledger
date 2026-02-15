import Dexie, { Table } from 'dexie';
import {
  Exercise,
  WorkoutTemplate,
  TemplateExercise,
  Workout,
  Set,
} from '../types/workout';
import {
  MealCategory,
  Food,
  Meal,
  MealItem,
  NutritionSummary,
} from '../types/nutrition';

// Sync queue item for offline mutations
export interface SyncQueueItem {
  id?: number;
  timestamp: number;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  entityType: string;
  entityId?: string;
  synced: boolean;
  error?: string;
}

export class HealthAppDatabase extends Dexie {
  // Workout tables
  exercises!: Table<Exercise, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;
  templateExercises!: Table<TemplateExercise, string>;
  workouts!: Table<Workout, string>;
  sets!: Table<Set, string>;

  // Nutrition tables
  mealCategories!: Table<MealCategory, string>;
  foods!: Table<Food, string>;
  meals!: Table<Meal, string>;
  mealItems!: Table<MealItem, string>;
  nutritionSummaries!: Table<NutritionSummary & { date: string }, string>;

  // Sync queue
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('HealthAppDB');

    this.version(1).stores({
      // Workout stores
      exercises: 'id, name, muscle_group, equipment, is_custom, user_id',
      workoutTemplates: 'id, user_id, name, created_at',
      templateExercises: 'id, template_id, exercise_id, order_index',
      workouts: 'id, user_id, template_id, workout_date, started_at, completed_at',
      sets: 'id, workout_id, exercise_id, set_number, created_at',

      // Nutrition stores
      mealCategories: 'id, user_id, name, display_order',
      foods: 'id, name, is_custom, user_id',
      meals: 'id, user_id, category_id, meal_date, meal_time',
      mealItems: 'id, meal_id, food_id',
      nutritionSummaries: 'date, user_id',

      // Sync queue
      syncQueue: '++id, timestamp, synced, entityType',
    });
  }
}

export const db = new HealthAppDatabase();

// Helper functions for common operations

// Clear all data (useful for logout)
export const clearAllData = async () => {
  await db.exercises.clear();
  await db.workoutTemplates.clear();
  await db.templateExercises.clear();
  await db.workouts.clear();
  await db.sets.clear();
  await db.mealCategories.clear();
  await db.foods.clear();
  await db.meals.clear();
  await db.mealItems.clear();
  await db.nutritionSummaries.clear();
  await db.syncQueue.clear();
};

// Get unsynced queue items
export const getUnsyncedItems = async (): Promise<SyncQueueItem[]> => {
  return await db.syncQueue.where('synced').equals(0).toArray();
};

// Mark queue item as synced
export const markAsSynced = async (id: number) => {
  await db.syncQueue.update(id, { synced: true });
};

// Mark queue item with error
export const markAsError = async (id: number, error: string) => {
  await db.syncQueue.update(id, { error, synced: false });
};

// Add to sync queue
export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'synced'>) => {
  await db.syncQueue.add({
    ...item,
    timestamp: Date.now(),
    synced: false,
  });
};
