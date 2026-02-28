import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  getCheatDayStatus,
  toggleCheatDayOn,
  toggleCheatDayOff,
} from '../services/nutrition.service';

export const useCheatDay = (date?: Date) => {
  const [isCheatDay, setIsCheatDay] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedDate = date || new Date();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadStatus();
  }, [dateStr]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await getCheatDayStatus(dateStr);
      setIsCheatDay(status.is_cheat_day);
    } catch {
      // Fail silently — toggle defaults to off
    } finally {
      setLoading(false);
    }
  };

  const toggle = useCallback(async () => {
    const newValue = !isCheatDay;
    setIsCheatDay(newValue);

    try {
      if (newValue) {
        await toggleCheatDayOn(dateStr);
      } else {
        await toggleCheatDayOff(dateStr);
      }
    } catch {
      setIsCheatDay(!newValue);
    }
  }, [isCheatDay, dateStr]);

  return {
    isCheatDay,
    loading,
    toggle,
  };
};
