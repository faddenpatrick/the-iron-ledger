import { useState, useEffect, useCallback } from 'react';
import { WeeklySummary } from '../types/nutrition';
import { getWeeklySummary } from '../services/nutrition.service';
import { format } from 'date-fns';

export const useWeeklySummary = (endDate?: Date) => {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEndDate = endDate || new Date();
  const dateStr = format(selectedEndDate, 'yyyy-MM-dd');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeeklySummary(dateStr);
      setSummary(data);
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to load weekly summary');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refresh = () => {
    loadSummary();
  };

  return {
    summary,
    loading,
    error,
    refresh,
  };
};
