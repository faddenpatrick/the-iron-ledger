import { useState, useEffect } from 'react';
import { NutritionSummary } from '../types/nutrition';
import { getNutritionSummary } from '../services/nutrition.service';
import { format } from 'date-fns';

export const useNutrition = (date?: Date) => {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDate = date || new Date();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadSummary();
  }, [dateStr]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNutritionSummary(dateStr);
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load nutrition summary');
    } finally {
      setLoading(false);
    }
  };

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
