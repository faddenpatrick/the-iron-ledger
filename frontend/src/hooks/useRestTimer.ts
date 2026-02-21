import { useState, useEffect, useRef, useCallback } from 'react';

// Lazily-initialized AudioContext (must be created after user gesture)
let audioCtx: AudioContext | null = null;

const getOrCreateAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    return audioCtx;
  } catch {
    return null;
  }
};

const ensureResumed = async (ctx: AudioContext): Promise<boolean> => {
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === 'running';
};

const playCompletionSound = async () => {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;

  // Await resume — critical for backgrounded tabs
  const isRunning = await ensureResumed(ctx);
  if (!isRunning) return;

  const playTone = (freq: number, startOffset: number, duration: number, gainValue: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';

    // Envelope: quick attack, sustain, then fade
    gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startOffset + 0.02);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime + startOffset + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  };

  // Three-tone ascending chime: C5 → E5 → G5 (major chord arpeggio)
  playTone(523.25, 0, 0.25, 0.5);     // C5, 250ms
  playTone(659.25, 0.28, 0.25, 0.5);  // E5, 250ms
  playTone(783.99, 0.56, 0.40, 0.5);  // G5, 400ms (final note rings longer)
};

export const useRestTimer = (defaultSeconds: number = 90) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Absolute timestamp (ms) when the timer should reach zero
  const endTimeRef = useRef<number>(0);
  // Milliseconds remaining when paused
  const pausedRemainingRef = useRef<number>(0);
  // Refs for cleanup
  const rafRef = useRef<number>(0);
  const intervalRef = useRef<number>(0);
  // Track whether we already fired completion for this timer cycle
  const completedRef = useRef<boolean>(false);

  const computeRemaining = useCallback((): number => {
    const ms = endTimeRef.current - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }, []);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsActive(false);
    setTimeRemaining(0);
    playCompletionSound();
  }, []);

  const tick = useCallback(() => {
    if (!isActive) return;

    const remaining = computeRemaining();
    setTimeRemaining(remaining);

    if (remaining <= 0) {
      handleComplete();
    }
  }, [isActive, computeRemaining, handleComplete]);

  // Main update loop: rAF for smooth visible updates + setInterval as background fallback
  useEffect(() => {
    if (!isActive) {
      return;
    }

    // requestAnimationFrame loop (pauses when tab hidden, but that's fine — setInterval covers it)
    let running = true;
    const rafLoop = () => {
      if (!running) return;
      tick();
      rafRef.current = requestAnimationFrame(rafLoop);
    };
    rafRef.current = requestAnimationFrame(rafLoop);

    // setInterval fallback — fires even in background (though throttled to ~1/sec)
    intervalRef.current = window.setInterval(() => {
      tick();
    }, 250);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, tick]);

  // Recalculate immediately when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, tick]);

  // Warm up AudioContext on the first user-initiated start (satisfies autoplay policy)
  const ensureAudioContext = useCallback(() => {
    getOrCreateAudioContext();
  }, []);

  const start = useCallback((seconds?: number) => {
    const duration = seconds ?? defaultSeconds;
    endTimeRef.current = Date.now() + duration * 1000;
    pausedRemainingRef.current = 0;
    completedRef.current = false;
    setTimeRemaining(duration);
    setIsActive(true);
    ensureAudioContext();
  }, [defaultSeconds, ensureAudioContext]);

  const pause = useCallback(() => {
    pausedRemainingRef.current = Math.max(0, endTimeRef.current - Date.now());
    setIsActive(false);
  }, []);

  const resume = useCallback(() => {
    if (pausedRemainingRef.current > 0) {
      endTimeRef.current = Date.now() + pausedRemainingRef.current;
      completedRef.current = false;
      setIsActive(true);
    }
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
    endTimeRef.current = 0;
    pausedRemainingRef.current = 0;
    completedRef.current = false;
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
    endTimeRef.current = 0;
    pausedRemainingRef.current = 0;
    completedRef.current = false;
  }, []);

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
