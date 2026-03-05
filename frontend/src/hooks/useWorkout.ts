import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../types/workout';
import { getWorkout, addSet, updateSet, deleteSet, swapExercise as swapExerciseApi } from '../services/workout.service';

export const useWorkout = (workoutId: string | null) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!workoutId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getWorkout(workoutId);
      setWorkout(data);
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId, loadWorkout]);

  const addNewSet = async (exerciseId: string, setNumber: number) => {
    if (!workoutId) return;

    try {
      const newSet = await addSet(workoutId, {
        exercise_id: exerciseId,
        set_number: setNumber,
      });

      setWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: [...prev.sets, newSet],
        };
      });

      return newSet;
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to add set');
      throw err;
    }
  };

  const updateExistingSet = async (
    setId: string,
    data: { weight?: number; reps?: number; rpe?: number }
  ) => {
    if (!workoutId) return;

    try {
      const updatedSet = await updateSet(workoutId, setId, data);

      setWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: prev.sets.map((s) => (s.id === setId ? updatedSet : s)),
        };
      });

      return updatedSet;
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to update set');
      throw err;
    }
  };

  const removeSet = async (setId: string) => {
    if (!workoutId) return;

    try {
      await deleteSet(workoutId, setId);

      setWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: prev.sets.filter((s) => s.id !== setId),
        };
      });
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to delete set');
      throw err;
    }
  };

  const swapExerciseInWorkout = async (oldExerciseId: string, newExerciseId: string) => {
    if (!workoutId) return;

    try {
      const updatedWorkout = await swapExerciseApi(workoutId, oldExerciseId, newExerciseId);
      setWorkout(updatedWorkout);
      return updatedWorkout;
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to swap exercise');
      throw err;
    }
  };

  const logTallyReps = async (exerciseId: string, reps: number) => {
    if (!workoutId || !workout) return;

    const existingSets = workout.sets.filter((s) => s.exercise_id === exerciseId);
    const setNumber = existingSets.length + 1;

    try {
      const newSet = await addSet(workoutId, {
        exercise_id: exerciseId,
        set_number: setNumber,
        reps,
      });

      const completedSet = await updateSet(workoutId, newSet.id, {
        is_completed: true,
      });

      setWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: [...prev.sets, completedSet],
        };
      });

      return completedSet;
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to log tally reps');
      throw err;
    }
  };

  return {
    workout,
    loading,
    error,
    loadWorkout,
    addNewSet,
    updateExistingSet,
    removeSet,
    swapExerciseInWorkout,
    logTallyReps,
  };
};
