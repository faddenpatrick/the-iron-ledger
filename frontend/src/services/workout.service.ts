import api from './api';
import { db, addToSyncQueue } from './indexeddb.service';
import { generateUUID } from '../utils/uuid';
import {
  Exercise,
  WorkoutTemplate,
  WorkoutTemplateList,
  Workout,
  WorkoutList,
  CreateTemplateRequest,
  CreateWorkoutRequest,
  CreateSetRequest,
  UpdateSetRequest,
  Set,
  PreviousPerformance,
  WorkoutWeeklyStats,
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
  const tempId = generateUUID();
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
export const getTemplates = async (params?: {
  workout_type?: string;
}): Promise<WorkoutTemplateList[]> => {
  // IndexedDB first
  let templates = await db.workoutTemplates.toArray();

  // Apply workout_type filter if specified
  if (params?.workout_type) {
    templates = templates.filter((t) => t.workout_type === params.workout_type);
  }

  // Background API update if online
  if (navigator.onLine) {
    try {
      const response = await api.get('/workouts/templates', { params });
      const apiTemplates = response.data;
      await db.workoutTemplates.bulkPut(apiTemplates);

      // Re-apply filter to API results
      if (params?.workout_type) {
        return apiTemplates.filter((t: WorkoutTemplateList) => t.workout_type === params.workout_type);
      }
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

export const updateTemplate = async (
  id: string,
  data: { name: string }
): Promise<WorkoutTemplate> => {
  const response = await api.put(`/workouts/templates/${id}`, data);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/workouts/templates/${id}`);
};

// Workouts
export const getWorkouts = async (params?: {
  start_date?: string;
  end_date?: string;
  workout_type?: string;
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
  console.log('createWorkout called with data:', data);

  const tempId = generateUUID();
  const now = new Date().toISOString();

  const workout: Workout = {
    id: tempId,
    user_id: '',
    template_id: data.template_id || null,
    template_name_snapshot: null,
    workout_type: data.workout_type || 'lifting',
    workout_date: data.workout_date,
    started_at: data.started_at || now,
    completed_at: null,
    created_at: now,
    updated_at: now,
    sets: [],
  };

  console.log('Workout object created:', workout);

  // Save to IndexedDB immediately
  try {
    console.log('Attempting to save to IndexedDB...');
    await db.workouts.add(workout);
    console.log('Saved to IndexedDB successfully');
  } catch (dbError) {
    console.error('IndexedDB save failed:', dbError);
    throw new Error(`IndexedDB error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
  }

  // Sync with server
  if (navigator.onLine) {
    try {
      console.log('Attempting to sync with server...');
      const response = await api.post('/workouts', data);
      const serverWorkout = response.data;
      console.log('Server workout created:', serverWorkout);
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
    console.log('Offline - adding to sync queue');
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

export const deleteWorkout = async (id: string): Promise<void> => {
  await api.delete(`/workouts/${id}`);
  // Also delete from IndexedDB
  await db.workouts.delete(id);
  // Delete associated sets
  const sets = await db.sets.where('workout_id').equals(id).toArray();
  await db.sets.bulkDelete(sets.map(s => s.id));
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
  const tempId = generateUUID();
  const now = new Date().toISOString();

  const set: Set = {
    id: tempId,
    workout_id: workoutId,
    exercise_id: data.exercise_id,
    exercise_name_snapshot: '', // Will be filled by backend
    set_number: data.set_number,
    set_type: data.set_type || 'normal',
    weight: data.weight ?? null,
    reps: data.reps ?? null,
    rpe: data.rpe ?? null,
    is_completed: false,
    completed_at: null,
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
  data: UpdateSetRequest
): Promise<Set> => {
  // Update IndexedDB first
  const existingSet = await db.sets.get(setId);
  if (existingSet) {
    await db.sets.update(setId, data);
  }

  // Sync with server if online
  if (navigator.onLine) {
    try {
      const response = await api.put(`/workouts/${workoutId}/sets/${setId}`, data);
      const serverSet = response.data;
      await db.sets.put(serverSet);
      return serverSet;
    } catch (error) {
      console.error('Failed to update set on server:', error);
      await addToSyncQueue({
        method: 'PUT',
        endpoint: `/workouts/${workoutId}/sets/${setId}`,
        data,
        entityType: 'set',
        entityId: setId,
      });
      return { ...existingSet, ...data } as Set;
    }
  } else {
    await addToSyncQueue({
      method: 'PUT',
      endpoint: `/workouts/${workoutId}/sets/${setId}`,
      data,
      entityType: 'set',
      entityId: setId,
    });
    return { ...existingSet, ...data } as Set;
  }
};

export const deleteSet = async (
  workoutId: string,
  setId: string
): Promise<void> => {
  await api.delete(`/workouts/${workoutId}/sets/${setId}`);
};

// Weekly Stats
export const getWorkoutWeeklyStats = async (
  endDate: string
): Promise<WorkoutWeeklyStats> => {
  const response = await api.get('/workouts/weekly-stats', {
    params: { end_date: endDate },
  });
  return response.data;
};

// Previous Performance
export const getPreviousPerformance = async (
  workoutId: string,
  exerciseId: string
): Promise<PreviousPerformance> => {
  try {
    const response = await api.get(
      `/workouts/${workoutId}/exercises/${exerciseId}/previous`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch previous performance:', error);
    // Return empty previous performance if API fails
    return {
      exercise_id: exerciseId,
      has_previous: false,
      previous_workout_date: null,
      previous_sets: [],
    };
  }
};
