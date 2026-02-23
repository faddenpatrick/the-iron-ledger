import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { BodyMeasurement } from '../../../types/measurements';
import { getMeasurements, logMeasurement } from '../../../services/measurements.service';

interface BodyWeightTrackerProps {
  units: 'lbs' | 'kg';
}

export const BodyWeightTracker: React.FC<BodyWeightTrackerProps> = ({ units }) => {
  const [weightInput, setWeightInput] = useState('');
  const [recentMeasurements, setRecentMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightLoading, setWeightLoading] = useState(true);
  const [weightSaving, setWeightSaving] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setWeightLoading(true);
        const data = await getMeasurements();
        setRecentMeasurements(data);

        // Check if today is already logged and pre-fill
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayEntry = data.find((m) => m.measurement_date === today);
        if (todayEntry && todayEntry.weight !== null) {
          setWeightInput(todayEntry.weight.toString());
          setTodayLogged(true);
        }
      } catch (error) {
        console.error('Failed to fetch measurements:', error);
      } finally {
        setWeightLoading(false);
      }
    };
    fetchMeasurements();
  }, []);

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setWeightSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await logMeasurement({
        measurement_date: today,
        weight: parseFloat(weightInput),
      });
      setTodayLogged(true);

      // Refresh measurements list
      const data = await getMeasurements();
      setRecentMeasurements(data);
    } catch (error) {
      alert('Failed to log weight');
    } finally {
      setWeightSaving(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Body Weight</h3>
      <p className="text-sm text-gray-400 mb-4">
        Track your weight over time. Your coach uses this data to give better insights.
      </p>

      {/* Weight input */}
      <div className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {todayLogged ? "Today's Weight" : 'Log Today'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="e.g., 185"
              className="input flex-1"
            />
            <span className="text-sm text-gray-400">{units}</span>
          </div>
        </div>
        <button
          onClick={handleLogWeight}
          disabled={weightSaving || !weightInput}
          className="btn btn-primary px-4 py-2"
        >
          {weightSaving ? '...' : todayLogged ? 'Update' : 'Log'}
        </button>
      </div>

      {/* Recent measurements */}
      {weightLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : recentMeasurements.length > 0 ? (
        <>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent</div>
          <div className="space-y-1.5">
            {recentMeasurements.slice(0, 7).map((m) => (
              <div key={m.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">
                  {format(parseISO(m.measurement_date), 'MMM d')}
                </span>
                <span className="text-gray-200 font-medium">
                  {m.weight !== null ? `${m.weight} ${units}` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* 30-day trend */}
          {(() => {
            const withWeight = recentMeasurements.filter((m) => m.weight !== null);
            if (withWeight.length >= 2) {
              const newest = withWeight[0].weight!;
              const oldest = withWeight[withWeight.length - 1].weight!;
              const change = newest - oldest;
              const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
              const color = change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-400';
              return (
                <div className={`mt-3 pt-3 border-t border-gray-700 text-sm ${color}`}>
                  {arrow} {change > 0 ? '+' : ''}{change.toFixed(1)} {units} over last {withWeight.length} entries
                </div>
              );
            }
            return null;
          })()}
        </>
      ) : (
        <p className="text-sm text-gray-500">No weight entries yet. Log your first weight above!</p>
      )}
    </div>
  );
};
