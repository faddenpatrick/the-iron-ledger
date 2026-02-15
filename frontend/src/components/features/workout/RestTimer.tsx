import React from 'react';
import { useRestTimer } from '../../../hooks/useRestTimer';

interface RestTimerProps {
  defaultSeconds?: number;
}

export const RestTimer: React.FC<RestTimerProps> = ({ defaultSeconds = 90 }) => {
  const { timeRemaining, isActive, formatTime, pause, resume, skip } =
    useRestTimer(defaultSeconds);

  if (timeRemaining === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-20">
      <div className="bg-primary-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{formatTime()}</div>
            {isActive ? (
              <button
                onClick={pause}
                className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resume}
                className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium"
              >
                Resume
              </button>
            )}
          </div>
          <button
            onClick={skip}
            className="px-4 py-2 bg-primary-700 hover:bg-primary-800 rounded-lg font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
