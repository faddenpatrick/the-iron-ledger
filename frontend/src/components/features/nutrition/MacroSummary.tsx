import React from 'react';
import { NutritionSummary } from '../../../types/nutrition';

interface MacroSummaryProps {
  summary: NutritionSummary;
  isCheatDay?: boolean;
}

export const MacroSummary: React.FC<MacroSummaryProps> = ({ summary, isCheatDay }) => {
  const calculatePercentage = (current: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const macros = [
    {
      name: 'Calories',
      current: summary.total_calories,
      target: summary.target_calories,
      color: 'steel',
      unit: '',
    },
    {
      name: 'Protein',
      current: summary.total_protein,
      target: summary.target_protein,
      color: 'iron',
      unit: 'g',
    },
    {
      name: 'Carbs',
      current: summary.total_carbs,
      target: summary.target_carbs,
      color: 'copper',
      unit: 'g',
    },
    {
      name: 'Fat',
      current: summary.total_fat,
      target: summary.target_fat,
      color: 'bronze',
      unit: 'g',
    },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Today's Nutrition</h3>

      {isCheatDay && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-center">
          <span className="text-amber-400 font-medium text-sm">
            Cheat Day -- not counted toward weekly averages
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {macros.map((macro) => {
          const percentage = calculatePercentage(macro.current, macro.target);
          const hasTarget = macro.target !== null && macro.target > 0;

          return (
            <div key={macro.name} className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">{macro.name}</div>
              <div className="text-2xl font-bold mb-2">
                {macro.current}
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
                    of {macro.target}
                    {macro.unit} ({Math.round(percentage)}%)
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
