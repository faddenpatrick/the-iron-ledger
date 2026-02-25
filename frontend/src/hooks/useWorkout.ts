import { useState, useEffect } from 'react';
import { Workout } from '../types/workout';
import { getWorkout, addSet, updateSet, deleteSet } from '../services/workout.service';

export const useWorkout = (workoutId: string | null) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId]);

  const loadWorkout = async () => {
    if (!workoutId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getWorkout(workoutId);
      setWorkout(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add set');
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update set');
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete set');
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log tally reps');
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
    logTallyReps,
  };
};
