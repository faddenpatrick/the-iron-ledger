import React from 'react';
import { LastCompletedWorkout } from '../../../types/workout';

interface LastWorkoutCardProps {
  workout: LastCompletedWorkout | null;
  loading: boolean;
}

export const LastWorkoutCard: React.FC<LastWorkoutCardProps> = ({ workout, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-400 py-4">Loading last workout...</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Last Workout</h3>
        <p className="text-gray-400 text-sm">
          No completed workouts yet. Start your first workout to see highlights here!
        </p>
      </div>
    );
  }

  const formattedDate = new Date(workout.workout_date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Last Workout</h3>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>

      {workout.template_name && (
        <div className="text-sm font-medium text-primary-300 mb-2">
          {workout.template_name}
        </div>
      )}

      <div className="flex gap-4 mb-3 text-sm text-gray-400">
        {workout.duration_minutes && (
          <span>{Math.round(workout.duration_minutes)} min</span>
        )}
        <span>{workout.total_sets} sets</span>
        {workout.total_volume > 0 && (
          <span>
            {workout.total_volume >= 1000
              ? `${(workout.total_volume / 1000).toFixed(1)}k`
              : Math.round(workout.total_volume)}{' '}
            vol
          </span>
        )}
      </div>

      <div className="space-y-1">
        {workout.exercises.map((ex) => (
          <div key={ex.name} className="flex justify-between text-sm">
            <span className="text-gray-300">{ex.name}</span>
            <span className="text-gray-500">
              {ex.sets}s{ex.max_weight != null ? ` @ ${ex.max_weight}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
