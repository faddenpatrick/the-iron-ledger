import React from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { BodyWeightTracker } from './BodyWeightTracker';

export const MeasurementsTab: React.FC = () => {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="card text-center py-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BodyWeightTracker units={settings?.units || 'lbs'} />
      {/* Future: body fat %, circumferences, etc. */}
    </div>
  );
};
