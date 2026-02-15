import api from './api';
import { db, addToSyncQueue } from './indexeddb.service';
import {
  Exercise,
  WorkoutTemplate,
  WorkoutTemplateList,
  Workout,
  WorkoutList,
  CreateTemplateRequest,
  CreateWorkoutRequest,
  CreateSetRequest,
  Set,
} from '../types/workout';

// Exercises
export const getExercises = async (params?: {
  search?: string;
  muscle_group?: string;
  equipment?: string;
}): Promise<Exercise[]> => {
  // IndexedDB first
  let exercises = await db.exercises.toArray();

  // Apply filters if specified
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    exercises = exercises.filter((e) =>
      e.name.toLowerCase().includes(searchLower)
    );
  }
  if (params?.muscle_group) {
    exercises = exercises.filter((e) => e.muscle_group === params.muscle_group);
  }
  if (params?.equipment) {
    exercises = exercises.filter((e) => e.equipment === params.equipment);
  }

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/exercises', { params });
      const apiExercises = response.data.items || response.data;
      await db.exercises.bulkPut(apiExercises);
      return apiExercises;
    } catch (error) {
      console.error('Failed to fetch exercises from API:', error);
    }
  }

  return exercises;
};

export const createExercise = async (data: {
  name: string;
  muscle_group?: string;
  equipment?: string;
}): Promise<Exercise> => {
  const tempId = crypto.randomUUID();
  const now = new Date().toISOString();
  const exercise: Exercise = {
    id: tempId,
    name: data.name,
    muscle_group: data.muscle_group || null,
    equipment: data.equipment || null,
    is_custom: true,
    user_id: null,
    created_at: now,
    updated_at: now,
  };

  // Save to IndexedDB immediately
  await db.exercises.add(exercise);

  // Queue for sync
  if (navigator.onLine) {
    try {
      const response = await api.post('/exercises', data);
      const serverExercise = response.data;
      // Replace temp exercise with server version
      await db.exercises.delete(tempId);
      await db.exercises.add(serverExercise);
      return serverExercise;
    } catch (error) {
      console.error('Failed to create exercise on server:', error);
      // Keep local version, add to sync queue
      await addToSyncQueue({
        method: 'POST',
        endpoint: '/exercises',
        data,
        entityType: 'exercise',
        entityId: tempId,
      });
      return exercise;
    }
  } else {
    // Offline - add to sync queue
    await addToSyncQueue({
      method: 'POST',
      endpoint: '/exercises',
      data,
      entityType: 'exercise',
      entityId: tempId,
    });
    return exercise;
  }
};

// Templates
export const getTemplates = async (): Promise<WorkoutTemplateList[]> => {
  // IndexedDB first
  const templates = await db.workoutTemplates.toArray();

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/workouts/templates');
      const apiTemplates = response.data;
      await db.workoutTemplates.bulkPut(apiTemplates);
      return apiTemplates;
    } catch (error) {
      console.error('Failed to fetch templates from API:', error);
    }
  }

  return templates as unknown as WorkoutTemplateList[];
};

export const getTemplate = async (id: string): Promise<WorkoutTemplate> => {
  const response = await api.get(`/workouts/templates/${id}`);
  return response.data;
};

export const createTemplate = async (
  data: CreateTemplateRequest
): Promise<WorkoutTemplate> => {
  const response = await api.post('/workouts/templates', data);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/workouts/templates/${id}`);
};

// Workouts
export const getWorkouts = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<WorkoutList[]> => {
  const response = await api.get('/workouts', { params });
  return response.data;
};

export const getWorkout = async (id: string): Promise<Workout> => {
  const response = await api.get(`/workouts/${id}`);
  return response.data;
};

export const createWorkout = async (
  data: CreateWorkoutRequest
): Promise<Workout> => {
  const tempId = crypto.randomUUID();
  const now = new Date().toISOString();

  const workout: Workout = {
    id: tempId,
    user_id: '',
    template_id: data.template_id || null,
    template_name_snapshot: null,
    workout_date: data.workout_date,
    started_at: data.started_at || now,
    completed_at: null,
    created_at: now,
    updated_at: now,
    sets: [],
  };

  // Save to IndexedDB immediately
  await db.workouts.add(workout);

  // Sync with server
  if (navigator.onLine) {
    try {
      const response = await api.post('/workouts', data);
      const serverWorkout = response.data;
      // Replace temp workout with server version
      await db.workouts.delete(tempId);
      await db.workouts.add(serverWorkout);
      return serverWorkout;
    } catch (error) {
      console.error('Failed to create workout on server:', error);
      await addToSyncQueue({
        method: 'POST',
        endpoint: '/workouts',
        data,
        entityType: 'workout',
        entityId: tempId,
      });
      return workout;
    }
  } else {
    await addToSyncQueue({
      method: 'POST',
      endpoint: '/workouts',
      data,
      entityType: 'workout',
      entityId: tempId,
    });
    return workout;
  }
};

export const completeWorkout = async (
  id: string,
  completed_at: string
): Promise<Workout> => {
  const response = await api.post(`/workouts/${id}/complete`, { completed_at });
  return response.data;
};

export const saveWorkoutAsTemplate = async (
  workoutId: string,
  templateName: string
): Promise<WorkoutTemplate> => {
  const response = await api.post(`/workouts/${workoutId}/save-as-template`, {
    template_name: templateName,
  });
  return response.data;
};

// Sets
export const addSet = async (
  workoutId: string,
  data: CreateSetRequest
): Promise<Set> => {
  const tempId = crypto.randomUUID();
  const now = new Date().toISOString();

  const set: Set = {
    id: tempId,
    workout_id: workoutId,
    exercise_id: data.exercise_id,
    exercise_name_snapshot: '', // Will be filled by backend
    set_number: data.set_number,
    weight: data.weight ?? null,
    reps: data.reps ?? null,
    rpe: data.rpe ?? null,
    created_at: now,
  };

  // Save to IndexedDB immediately
  await db.sets.add(set);

  // Sync with server
  if (navigator.onLine) {
    try {
      const response = await api.post(`/workouts/${workoutId}/sets`, data);
      const serverSet = response.data;
      // Replace temp set with server version
      await db.sets.delete(tempId);
      await db.sets.add(serverSet);
      return serverSet;
    } catch (error) {
      console.error('Failed to create set on server:', error);
      await addToSyncQueue({
        method: 'POST',
        endpoint: `/workouts/${workoutId}/sets`,
        data,
        entityType: 'set',
        entityId: tempId,
      });
      return set;
    }
  } else {
    await addToSyncQueue({
      method: 'POST',
      endpoint: `/workouts/${workoutId}/sets`,
      data,
      entityType: 'set',
      entityId: tempId,
    });
    return set;
  }
};

export const updateSet = async (
  workoutId: string,
  setId: string,
  data: { weight?: number; reps?: number; rpe?: number }
): Promise<Set> => {
  const response = await api.put(`/workouts/${workoutId}/sets/${setId}`, data);
  return response.data;
};

export const deleteSet = async (
  workoutId: string,
  setId: string
): Promise<void> => {
  await api.delete(`/workouts/${workoutId}/sets/${setId}`);
};
