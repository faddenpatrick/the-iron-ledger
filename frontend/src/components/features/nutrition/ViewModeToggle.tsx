import React from 'react';

interface ViewModeToggleProps {
  mode: 'today' | 'weekly';
  onModeChange: (mode: 'today' | 'weekly') => void;
}

export default function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex gap-2">
        {/* Today Button */}
        <button
          onClick={() => onModeChange('today')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'today'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Today
        </button>

        {/* 7-Day Average Button */}
        <button
          onClick={() => onModeChange('weekly')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          7-Day Average
        </button>
      </div>
    </div>
  );
}
