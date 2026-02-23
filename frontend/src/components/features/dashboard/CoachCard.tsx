import React, { useEffect, useState } from 'react';
import { getCoachInsight } from '../../../services/coaching.service';
import { CoachInsight, COACH_OPTIONS } from '../../../types/coaching';

export const CoachCard: React.FC = () => {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getCoachInsight();
      setInsight(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  // Get icon for the coach
  const coachIcon = insight
    ? COACH_OPTIONS.find((c) => c.key === insight.coach_type)?.icon || '🏋️'
    : '🏋️';

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
            <div className="h-4 bg-gray-700 rounded w-40" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-700 rounded w-5/6" />
            <div className="h-3 bg-gray-700 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xl">🏋️</span>
            <span className="text-sm font-medium">Coach</span>
          </div>
          <button
            onClick={fetchInsight}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            Retry
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Coach is unavailable right now. Tap retry to try again.
        </p>
      </div>
    );
  }

  if (!insight) return null;

  // Format the generated_at timestamp
  const generatedDate = new Date(insight.generated_at);
  const timeStr = generatedDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="card relative overflow-hidden border border-primary-500/20">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/60 via-primary-400/40 to-transparent" />

      {/* Coach header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{coachIcon}</span>
        <div>
          <span className="text-sm font-semibold text-primary-300">
            {insight.coach_name}
          </span>
          <span className="text-xs text-gray-500 ml-1.5">
            {insight.coach_title}
          </span>
        </div>
      </div>

      {/* Insight text */}
      <p className="text-gray-200 text-sm leading-relaxed italic">
        &ldquo;{insight.insight}&rdquo;
      </p>

      {/* Timestamp */}
      <p className="text-xs text-gray-600 mt-3 text-right">
        Today {timeStr}
      </p>
    </div>
  );
};
