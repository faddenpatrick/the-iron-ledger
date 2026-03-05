import { useState, useEffect, useCallback } from 'react';
import { NutritionSummary } from '../types/nutrition';
import { getNutritionSummary } from '../services/nutrition.service';
import { format } from 'date-fns';

export const useNutrition = (date?: Date) => {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = date || new Date();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNutritionSummary(dateStr);
      setSummary(data);
    } catch (err: unknown) {
      const detail = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(detail || 'Failed to load nutrition summary');
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
