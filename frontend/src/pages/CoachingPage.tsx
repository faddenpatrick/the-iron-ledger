import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { getDailyCoaching } from '../services/coaching.service';
import { DailyCoaching, COACH_OPTIONS } from '../types/coaching';

export const CoachingPage: React.FC = () => {
  const [coaching, setCoaching] = useState<DailyCoaching | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCoaching = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getDailyCoaching();
      setCoaching(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaching();
  }, []);

  const coachIcon = coaching
    ? COACH_OPTIONS.find((c) => c.key === coaching.coach_type)?.icon || '🏋️'
    : '🏋️';

  return (
    <div className="min-h-screen pb-20">
      <Header title="Coach" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-6">
            {/* Coach identity skeleton */}
            <div className="card">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-40 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-28" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-5/6" />
                  <div className="h-3 bg-gray-700 rounded w-4/6" />
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            </div>
            <div className="card animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-700 rounded w-5/6" />
                <div className="h-3 bg-gray-700 rounded w-4/6" />
              </div>
            </div>
            <div className="card animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-44 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-700 rounded w-5/6" />
                <div className="h-3 bg-gray-700 rounded w-3/6" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-xl">🏋️</span>
                <span className="text-sm font-medium">Coach</span>
              </div>
              <button
                onClick={fetchCoaching}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Retry
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Coach is unavailable right now. Tap retry to try again.
            </p>
          </div>
        ) : coaching ? (
          <>
            {/* Daily Summary */}
            <div className="card relative overflow-hidden border border-primary-500/20">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/60 via-primary-400/40 to-transparent" />

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{coachIcon}</span>
                <div>
                  <div className="text-base font-semibold text-primary-300">
                    {coaching.coach_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {coaching.coach_title}
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Daily Summary
              </h3>
              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {coaching.summary}
              </div>

              <p className="text-xs text-gray-600 mt-4 text-right">
                Today{' '}
                {new Date(coaching.generated_at).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Workout Tips */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Workout Tips
                </h3>
              </div>
              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {coaching.workout_tips}
              </div>
            </div>

            {/* Nutrition & Supplements */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5 0c-.99.143-1.99.317-2.98.52m2.98-.52l2.62 10.726c.122.499-.106 1.028-.59 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 4.97z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Nutrition & Supplements
                </h3>
              </div>
              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {coaching.nutrition_tips}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
