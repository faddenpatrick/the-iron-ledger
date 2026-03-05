import React, { useState, useEffect } from 'react';

interface RestTimerProps {
  timeRemaining: number;
  isActive: boolean;
  formatTime: () => string;
  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  defaultSeconds: number;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  timeRemaining,
  isActive,
  formatTime,
  start,
  pause,
  resume,
  skip,
  defaultSeconds,
}) => {
  const [selectedSeconds, setSelectedSeconds] = useState(defaultSeconds);
  const [showPresets, setShowPresets] = useState(true);
  const [justCompleted, setJustCompleted] = useState(false);

  // Sync selectedSeconds when defaultSeconds changes
  useEffect(() => {
    setSelectedSeconds(defaultSeconds);
  }, [defaultSeconds]);

  // Flash green when timer completes
  useEffect(() => {
    if (timeRemaining === 0 && !isActive) {
      setJustCompleted(true);
      setShowPresets(true);

      // Vibrate if supported (mobile)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Clear flash after 2 seconds
      const timeout = setTimeout(() => {
        setJustCompleted(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [timeRemaining, isActive]);

  const handleAdjust = (delta: number) => {
    setSelectedSeconds((prev) => Math.max(15, Math.min(600, prev + delta)));
  };

  const handleStartTimer = () => {
    start(selectedSeconds);
    setShowPresets(false);
  };

  const formatDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (timeRemaining === 0 && !justCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-20">
      <div
        className={`rounded-lg p-4 shadow-lg transition-colors duration-300 ${
          justCompleted
            ? 'bg-green-600 animate-complete-glow'
            : 'bg-primary-600'
        }`}
      >
        {showPresets ? (
          <div className="space-y-3">
            <div className="text-center text-sm font-medium mb-2">Rest Timer</div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleAdjust(-15)}
                className="w-12 h-12 bg-white text-primary-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <div className="text-3xl font-bold min-w-[5rem] text-center">
                {formatDisplay(selectedSeconds)}
              </div>
              <button
                onClick={() => handleAdjust(15)}
                className="w-12 h-12 bg-white text-primary-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>

            <button
              onClick={handleStartTimer}
              className="w-full py-2 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start
            </button>
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
          <div className="text-center font-bold text-lg mt-2 animate-fade-in">
            Rest Complete!
          </div>
        )}
      </div>
    </div>
  );
};
