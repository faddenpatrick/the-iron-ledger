import React, { useState } from 'react';
import { Set } from '../../../types/workout';

interface TallyExerciseProps {
  exerciseId: string;
  exerciseName: string;
  targetReps: number;
  sets: Set[];
  previousTotalReps: number | null;
  previousWorkoutDate: string | null;
  onLogReps: (reps: number) => void;
  onUndoLast: () => void;
}

export const TallyExercise: React.FC<TallyExerciseProps> = ({
  targetReps,
  sets,
  previousTotalReps,
  previousWorkoutDate,
  onLogReps,
  onUndoLast,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customReps, setCustomReps] = useState(5);
  const [showHistory, setShowHistory] = useState(false);

  const completedReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const progressPercent = Math.min((completedReps / targetReps) * 100, 100);
  const isComplete = completedReps >= targetReps;
  const remainingReps = Math.max(targetReps - completedReps, 0);

  const quickLogValues = [1, 3, 5, 8, 10];

  const handleCustomLog = () => {
    if (customReps > 0) {
      onLogReps(customReps);
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Previous performance */}
      {previousTotalReps !== null && previousWorkoutDate && (
        <div className="text-xs text-gray-400">
          Last: {previousTotalReps} reps on{' '}
          {new Date(previousWorkoutDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      )}

      {/* Progress display */}
      <div className="text-center">
        <div className="text-3xl font-bold mb-2">
          <span className={isComplete ? 'text-green-400' : 'text-white'}>
            {completedReps}
          </span>
          <span className="text-gray-500 text-xl"> / {targetReps}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{Math.round(progressPercent)}%</span>
          <span>
            {isComplete ? 'Target reached!' : `${remainingReps} remaining`}
          </span>
        </div>
      </div>

      {/* Quick-log buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickLogValues.map((val) => (
          <button
            key={val}
            onClick={() => onLogReps(val)}
            className="btn btn-secondary py-3 text-lg font-semibold"
          >
            +{val}
          </button>
        ))}
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className={`btn py-3 text-sm font-semibold ${
            showCustomInput ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom input */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomReps(Math.max(1, customReps - 1))}
            className="btn btn-secondary px-3 py-2"
          >
            -
          </button>
          <input
            type="number"
            value={customReps}
            onChange={(e) => setCustomReps(Math.max(1, parseInt(e.target.value) || 1))}
            className="input text-center flex-1"
            min="1"
          />
          <button
            onClick={() => setCustomReps(customReps + 1)}
            className="btn btn-secondary px-3 py-2"
          >
            +
          </button>
          <button
            onClick={handleCustomLog}
            className="btn btn-primary px-4 py-2"
          >
            Log
          </button>
        </div>
      )}

      {/* Mini-set history + undo */}
      {sets.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-400 hover:text-gray-300 mb-1"
          >
            {showHistory ? 'Hide' : 'Show'} sets ({sets.length})
          </button>

          {showHistory && (
            <div className="flex flex-wrap gap-1 mb-2">
              {sets
                .sort((a, b) => a.set_number - b.set_number)
                .map((set) => (
                  <span
                    key={set.id}
                    className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    {set.reps}
                  </span>
                ))}
            </div>
          )}

          <button
            onClick={onUndoLast}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Undo last ({sets[sets.length - 1]?.reps} reps)
          </button>
        </div>
      )}
    </div>
  );
};
