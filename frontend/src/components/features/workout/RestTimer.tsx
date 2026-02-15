import React, { useState, useEffect } from 'react';
import { useRestTimer } from '../../../hooks/useRestTimer';

interface RestTimerProps {
  defaultSeconds?: number;
}

const PRESET_DURATIONS = [
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
];

export const RestTimer: React.FC<RestTimerProps> = ({ defaultSeconds = 60 }) => {
  const { timeRemaining, isActive, formatTime, start, pause, resume, skip } =
    useRestTimer(defaultSeconds);
  const [showPresets, setShowPresets] = useState(true);
  const [customSeconds, setCustomSeconds] = useState('60');
  const [justCompleted, setJustCompleted] = useState(false);

  // Flash green when timer completes
  useEffect(() => {
    if (timeRemaining === 0 && !isActive) {
      setJustCompleted(true);
      setShowPresets(true);

      // Vibrate if supported (mobile)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Clear flash after 2 seconds
      const timeout = setTimeout(() => {
        setJustCompleted(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [timeRemaining, isActive]);

  const handleStartTimer = (seconds: number) => {
    start(seconds);
    setShowPresets(false);
  };

  const handleCustomStart = () => {
    const seconds = parseInt(customSeconds);
    if (seconds > 0 && seconds <= 600) {
      handleStartTimer(seconds);
    }
  };

  if (timeRemaining === 0 && !justCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-20">
      <div
        className={`rounded-lg p-4 shadow-lg transition-colors duration-300 ${
          justCompleted
            ? 'bg-green-600 animate-pulse'
            : 'bg-primary-600'
        }`}
      >
        {showPresets ? (
          <div className="space-y-3">
            <div className="text-center text-sm font-medium mb-2">Rest Timer</div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.seconds}
                  onClick={() => handleStartTimer(preset.seconds)}
                  className="px-3 py-2 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="number"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value)}
                placeholder="Custom (s)"
                className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-lg text-center font-medium"
                min="1"
                max="600"
              />
              <button
                onClick={handleCustomStart}
                className="px-4 py-2 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{formatTime()}</div>
              {isActive ? (
                <button
                  onClick={pause}
                  className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Resume
                </button>
              )}
            </div>
            <button
              onClick={skip}
              className="px-4 py-2 bg-primary-700 hover:bg-primary-800 rounded-lg font-medium transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {justCompleted && (
          <div className="text-center font-bold text-lg mt-2">
            Rest Complete! 💪
          </div>
        )}
      </div>
    </div>
  );
};
