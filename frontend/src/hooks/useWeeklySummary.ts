import { useState, useEffect } from 'react';
import { WeeklySummary } from '../types/nutrition';
import { getWeeklySummary } from '../services/nutrition.service';
import { format } from 'date-fns';

export const useWeeklySummary = (endDate?: Date) => {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEndDate = endDate || new Date();
  const dateStr = format(selectedEndDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadSummary();
  }, [dateStr]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeeklySummary(dateStr);
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load weekly summary');
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
