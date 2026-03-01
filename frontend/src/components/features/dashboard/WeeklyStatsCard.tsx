import React from 'react';
import { WeeklySummary } from '../../../types/nutrition';
import { WorkoutWeeklyStats } from '../../../types/workout';

interface WeeklyStatsCardProps {
  nutritionStats: WeeklySummary | null;
  workoutStats: WorkoutWeeklyStats | null;
  loading: boolean;
}

function computeMacroRatio(stats: WeeklySummary): string {
  const pCal = stats.avg_protein * 4;
  const cCal = stats.avg_carbs * 4;
  const fCal = stats.avg_fat * 9;
  const total = pCal + cCal + fCal;
  if (total === 0) return '--';
  return `P:${Math.round((pCal / total) * 100)}% C:${Math.round((cCal / total) * 100)}% F:${Math.round((fCal / total) * 100)}%`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return `${Math.round(volume)}`;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({
  nutritionStats,
  workoutStats,
  loading,
}) => {
  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-400 py-4">Loading weekly stats...</div>
      </div>
    );
  }

  const hasNutritionData = nutritionStats && nutritionStats.days_with_data > 0;
  const hasWorkoutData = workoutStats && workoutStats.workouts_completed > 0;

  if (!hasNutritionData && !hasWorkoutData) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Weekly Stats</h3>
        <p className="text-gray-400 text-sm">
          Complete workouts and log meals to see your weekly stats here.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Weekly Stats</h3>
        <div className="text-right">
          <span className="text-xs text-gray-500">7-day snapshot</span>
          {nutritionStats && nutritionStats.cheat_day_count > 0 && (
            <div className="text-xs text-amber-400">
              {nutritionStats.cheat_day_count} cheat {nutritionStats.cheat_day_count === 1 ? 'day' : 'days'} excluded
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Avg Calories */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <span className="text-xs text-gray-400">Avg Calories</span>
          </div>
          <div className="text-lg font-bold">
            {hasNutritionData ? nutritionStats.avg_calories.toLocaleString() : '--'}
            <span className="text-xs text-gray-400 font-normal ml-1">/day</span>
          </div>
        </div>

        {/* Workouts */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-gray-400">Workouts</span>
          </div>
          <div className="text-lg font-bold">
            {hasWorkoutData ? workoutStats.workouts_completed : '0'}
          </div>
        </div>

        {/* Macro Split */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span className="text-xs text-gray-400">Macro Split</span>
          </div>
          <div className="text-sm font-bold">
            {hasNutritionData ? computeMacroRatio(nutritionStats) : '--'}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-xs text-gray-400">Volume</span>
          </div>
          <div className="text-lg font-bold">
            {hasWorkoutData && workoutStats.total_volume > 0
              ? formatVolume(workoutStats.total_volume)
              : '--'}
            {hasWorkoutData && workoutStats.total_volume > 0 && (
              <span className="text-xs text-gray-400 font-normal ml-1">kg</span>
            )}
          </div>
        </div>

        {/* Avg Duration */}
        {hasWorkoutData && workoutStats.avg_workout_duration_minutes && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-400">Avg Duration</span>
            </div>
            <div className="text-lg font-bold">
              {Math.round(workoutStats.avg_workout_duration_minutes)}
              <span className="text-xs text-gray-400 font-normal ml-1">min</span>
            </div>
          </div>
        )}

        {/* Days Tracked */}
        {hasNutritionData && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-400">Days Tracked</span>
            </div>
            <div className="text-lg font-bold">
              {nutritionStats.days_with_data}
              <span className="text-xs text-gray-400 font-normal ml-1">/7</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
