import React from 'react';

interface CheatDayToggleProps {
  isCheatDay: boolean;
  loading: boolean;
  onToggle: () => void;
}

export const CheatDayToggle: React.FC<CheatDayToggleProps> = ({
  isCheatDay,
  loading,
  onToggle,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-1">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-300">Cheat Day</span>
        <button
          onClick={onToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isCheatDay ? 'bg-amber-500' : 'bg-gray-600'
          } ${loading ? 'opacity-50' : ''}`}
          role="switch"
          aria-checked={isCheatDay}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isCheatDay ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
