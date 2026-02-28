import React from 'react';
import { WeeklySummary as WeeklySummaryType } from '../../../types/nutrition';
import { format, parseISO } from 'date-fns';

interface WeeklySummaryProps {
  summary: WeeklySummaryType | null;
  loading: boolean;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-400">Loading weekly averages...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card">
        <div className="text-center text-gray-400">Unable to load weekly summary</div>
      </div>
    );
  }

  // Empty state if insufficient data
  if (summary.days_with_data < 2) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">7-Day Average</h3>
        <div className="p-6 bg-gray-700 rounded-lg text-center">
          <div className="text-gray-400 mb-2">Not enough data</div>
          <div className="text-sm text-gray-500">
            Log at least 2 days to see weekly averages
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {summary.days_with_data} of 7 days logged
          </div>
        </div>
      </div>
    );
  }

  const calculatePercentage = (current: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const calculateDelta = (current: number, target: number | null) => {
    if (!target) return null;
    return current - target;
  };

  const macros = [
    {
      name: 'Calories',
      average: summary.avg_calories,
      target: summary.target_calories,
      color: 'steel',
      unit: '',
    },
    {
      name: 'Protein',
      average: summary.avg_protein,
      target: summary.target_protein,
      color: 'iron',
      unit: 'g',
    },
    {
      name: 'Carbs',
      average: summary.avg_carbs,
      target: summary.target_carbs,
      color: 'copper',
      unit: 'g',
    },
    {
      name: 'Fat',
      average: summary.avg_fat,
      target: summary.target_fat,
      color: 'bronze',
      unit: 'g',
    },
  ];

  const startDate = format(parseISO(summary.start_date), 'MMM d');
  const endDate = format(parseISO(summary.end_date), 'MMM d');

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">7-Day Average</h3>
        <div className="text-sm text-gray-400 mt-1">
          {startDate} - {endDate} • {summary.days_with_data} days logged
          {summary.cheat_day_count > 0 && (
            <span className="text-amber-400 ml-1">
              • {summary.cheat_day_count} cheat {summary.cheat_day_count === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {macros.map((macro) => {
          const percentage = calculatePercentage(macro.average, macro.target);
          const delta = calculateDelta(macro.average, macro.target);
          const hasTarget = macro.target !== null && macro.target > 0;

          return (
            <div key={macro.name} className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">{macro.name}</div>
              <div className="text-2xl font-bold mb-2">
                {macro.average}
                {macro.unit}
              </div>
              {hasTarget && (
                <>
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        macro.color === 'steel'
                          ? 'bg-blue-500'
                          : macro.color === 'iron'
                          ? 'bg-gray-400'
                          : macro.color === 'copper'
                          ? 'bg-amber-500'
                          : 'bg-yellow-700'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(percentage)}% of target
                    {delta !== null && (
                      <span
                        className={`ml-2 ${
                          delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-blue-400' : ''
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {delta}
                        {macro.unit}/day
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!summary.target_calories && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-400">
          ⚙ Set macro targets in Settings to track your progress
        </div>
      )}
    </div>
  );
};
