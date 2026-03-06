import React from 'react';
import { RecentPR } from '../../../types/workout';

interface RecentPRsCardProps {
  prs: RecentPR[];
  loading: boolean;
}

export const RecentPRsCard: React.FC<RecentPRsCardProps> = ({ prs, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-400 py-4">Loading PRs...</div>
      </div>
    );
  }

  if (prs.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Recent PRs</h3>
      <div className="space-y-2">
        {prs.map((pr) => {
          const formattedDate = new Date(pr.date_achieved + 'T00:00:00').toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={`${pr.exercise_name}-${pr.date_achieved}`}
              className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">{pr.exercise_name}</div>
                <div className="text-xs text-gray-500">{formattedDate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary-300">{pr.weight}</div>
                {pr.previous_best != null && (
                  <div className="text-xs text-green-400">
                    +{(pr.weight - pr.previous_best).toFixed(1)} from {pr.previous_best}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
