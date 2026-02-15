import { useState, useEffect, useRef, useCallback } from 'react';

export const useRestTimer = (defaultSeconds: number = 90) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback((seconds?: number) => {
    const duration = seconds ?? defaultSeconds;
    setTimeRemaining(duration);
    setIsActive(true);
  }, [defaultSeconds]);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const resume = useCallback(() => {
    if (timeRemaining > 0) {
      setIsActive(true);
    }
  }, [timeRemaining]);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
  }, []);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            // Could add notification here
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const formatTime = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    timeRemaining,
    isActive,
    formatTime,
    start,
    pause,
    resume,
    reset,
    skip,
  };
};
