import React, { useState, useEffect } from 'react';
import { Workout } from '../../../types/workout';
import { getWorkout } from '../../../services/workout.service';
import { format } from 'date-fns';

interface WorkoutViewerProps {
  workoutId: string;
  onClose: () => void;
}

export const WorkoutViewer: React.FC<WorkoutViewerProps> = ({
  workoutId,
  onClose,
}) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    setLoading(true);
    try {
      const data = await getWorkout(workoutId);
      setWorkout(data);
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group sets by exercise
  const exerciseGroups = workout?.sets.reduce((acc, set) => {
    const exerciseId = set.exercise_id;
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseId,
        exerciseName: set.exercise_name_snapshot,
        sets: [],
      };
    }
    acc[exerciseId].sets.push(set);
    return acc;
  }, {} as Record<string, { exerciseId: string; exerciseName: string; sets: any[] }>);

  const exercises = exerciseGroups ? Object.values(exerciseGroups) : [];

  // Calculate total volume
  const totalVolume = workout?.sets.reduce((sum, set) => {
    if (set.weight && set.reps) {
      return sum + (set.weight * set.reps);
    }
    return sum;
  }, 0) || 0;

  // Calculate workout duration
  const workoutDuration = workout?.started_at && workout?.completed_at
    ? Math.floor(
        (new Date(workout.completed_at).getTime() - new Date(workout.started_at).getTime()) / 1000 / 60
      )
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading workout...</div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-gray-400">Workout not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">
              {workout.template_name_snapshot || 'Freestyle Workout'}
            </h2>
            <p className="text-sm text-gray-400">
              {format(new Date(workout.workout_date), 'EEEE, MMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{workoutDuration}m</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Volume (lbs)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{workout.sets.length}</div>
            <div className="text-xs text-gray-500">Total Sets</div>
          </div>
        </div>
      </div>

      {/* Exercises and Sets */}
      <div className="space-y-4">
        {exercises.map((group) => (
          <div key={group.exerciseId} className="card">
            <h3 className="font-semibold text-lg mb-3">{group.exerciseName}</h3>

            {/* Sets Table */}
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-medium pb-2 border-b border-gray-700">
                <div className="text-center">Set</div>
                <div className="text-center">Weight</div>
                <div className="text-center">Reps</div>
                <div className="text-center">RPE</div>
              </div>

              {/* Sets */}
              {group.sets
                .sort((a, b) => a.set_number - b.set_number)
                .map((set, index) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-4 gap-2 py-2 px-3 rounded ${
                      set.is_completed ? 'bg-gray-700' : 'bg-gray-800 opacity-50'
                    }`}
                  >
                    <div className="text-center font-medium">
                      {set.is_completed && <span className="text-green-400 mr-1">✓</span>}
                      {index + 1}
                    </div>
                    <div className="text-center">
                      {set.weight ? `${set.weight} lbs` : '-'}
                    </div>
                    <div className="text-center">
                      {set.reps || '-'}
                    </div>
                    <div className="text-center">
                      {set.rpe || '-'}
                    </div>
                  </div>
                ))}
            </div>

            {/* Exercise Stats */}
            <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Exercise Volume:</span>
                <span className="font-medium text-white">
                  {group.sets
                    .reduce((sum, set) => {
                      if (set.weight && set.reps) {
                        return sum + (set.weight * set.reps);
                      }
                      return sum;
                    }, 0)
                    .toLocaleString()} lbs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
