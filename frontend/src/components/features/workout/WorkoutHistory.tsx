import React, { useState, useEffect } from 'react';
import { WorkoutList } from '../../../types/workout';
import { getWorkouts, deleteWorkout } from '../../../services/workout.service';
import { format, subDays, startOfWeek } from 'date-fns';

interface WorkoutHistoryProps {
  workoutType: 'lifting' | 'cardio';
  onSelectWorkout?: (workoutId: string) => void;
}

type TimeFilter = 'week' | 'month' | 'all';

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workoutType,
  onSelectWorkout,
}) => {
  const [workouts, setWorkouts] = useState<WorkoutList[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, [workoutType, timeFilter]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let start_date: string | undefined;

      switch (timeFilter) {
        case 'week':
          start_date = format(startOfWeek(now), 'yyyy-MM-dd');
          break;
        case 'month':
          start_date = format(subDays(now, 30), 'yyyy-MM-dd');
          break;
        case 'all':
          start_date = undefined;
          break;
      }

      const data = await getWorkouts({
        start_date,
        workout_type: workoutType,
      });

      // Filter completed workouts only and sort by date descending
      const completedWorkouts = data
        .filter((w) => w.completed_at !== null)
        .sort(
          (a, b) =>
            new Date(b.workout_date).getTime() -
            new Date(a.workout_date).getTime()
        );

      setWorkouts(completedWorkouts);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDuration = (started: string, completed: string): string => {
    const start = new Date(started);
    const end = new Date(completed);
    const diffMinutes = Math.floor(
      (end.getTime() - start.getTime()) / 1000 / 60
    );

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkout(id);
      setWorkouts(workouts.filter((w) => w.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete workout:', error);
      alert('Failed to delete workout');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'week' as TimeFilter, label: 'This Week' },
          { id: 'month' as TimeFilter, label: 'Last 30 Days' },
          { id: 'all' as TimeFilter, label: 'All Time' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              timeFilter === filter.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Workout List */}
      {workouts.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 mb-2">No workouts yet</p>
          <p className="text-sm text-gray-500">
            Complete a {workoutType} workout to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div key={workout.id} className="card">
              {deletingId === workout.id ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    Delete &quot;{workout.template_name_snapshot || 'Freestyle Workout'}&quot;?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(workout.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectWorkout?.(workout.id)}
                  >
                    <h3 className="font-semibold text-lg">
                      {workout.template_name_snapshot || 'Freestyle Workout'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {format(new Date(workout.workout_date), 'EEEE, MMM d, yyyy')}
                    </p>
                    {workout.completed_at && (
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>
                          ⏱️ {formatDuration(workout.started_at, workout.completed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400">
                      {new Date(workout.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <button
                      onClick={() => setDeletingId(workout.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
