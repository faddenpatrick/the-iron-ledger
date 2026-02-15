import React from 'react';

export const CardioPlaceholder: React.FC = () => {
  return (
    <div className="card p-8">
      <div className="text-center space-y-6">
        <div className="text-6xl">🏃‍♂️</div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cardio Tracking</h2>
          <p className="text-gray-400">Coming Soon</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-sm font-medium text-gray-300">Duration</div>
            <div className="text-xs text-gray-500">Track time</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl mb-2">📏</div>
            <div className="text-sm font-medium text-gray-300">Distance</div>
            <div className="text-xs text-gray-500">Miles or km</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-medium text-gray-300">Pace</div>
            <div className="text-xs text-gray-500">Min/mile</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-sm font-medium text-gray-300">Intervals</div>
            <div className="text-xs text-gray-500">HIIT tracking</div>
          </div>
        </div>

        <p className="text-sm text-gray-500 pt-4">
          Full cardio tracking with custom workouts, metrics, and progress charts will be available in a future update.
        </p>
      </div>
    </div>
  );
};
