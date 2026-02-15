import React, { useState } from 'react';
import { Set, SetType, PreviousSetData } from '../../../types/workout';

interface SetRowProps {
  set: Set;
  setNumber: number;
  previousData: PreviousSetData | null;
  onUpdate: (data: {
    set_type?: SetType;
    weight?: number;
    reps?: number;
    rpe?: number;
    is_completed?: boolean;
  }) => void;
  onComplete: () => void;
  onDelete: () => void;
}

const SET_TYPE_CONFIG = {
  warmup: { label: 'Warmup', color: 'bg-orange-500', icon: '🔥' },
  normal: { label: 'Normal', color: 'bg-blue-500', icon: '💪' },
  drop_set: { label: 'Drop Set', color: 'bg-purple-500', icon: '⬇️' },
  failure: { label: 'Failure', color: 'bg-red-500', icon: '🔴' },
};

export const SetRow: React.FC<SetRowProps> = ({
  set,
  setNumber,
  previousData,
  onUpdate,
  onComplete,
  onDelete,
}) => {
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [rpe, setRpe] = useState(set.rpe?.toString() || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSetTypeMenu, setShowSetTypeMenu] = useState(false);

  const handleWeightChange = (value: string) => {
    setWeight(value);
    const numValue = value ? parseFloat(value) : undefined;
    onUpdate({ weight: numValue });
  };

  const handleRepsChange = (value: string) => {
    setReps(value);
    const numValue = value ? parseInt(value) : undefined;
    onUpdate({ reps: numValue });
  };

  const handleRpeChange = (value: string) => {
    setRpe(value);
    const numValue = value ? parseFloat(value) : undefined;
    onUpdate({ rpe: numValue });
  };

  const handleSetTypeChange = (newType: SetType) => {
    onUpdate({ set_type: newType });
    setShowSetTypeMenu(false);
  };

  const handleToggleComplete = () => {
    const newCompletedState = !set.is_completed;
    onUpdate({ is_completed: newCompletedState });

    // Trigger rest timer if completing the set
    if (newCompletedState) {
      onComplete();
    }
  };

  const incrementWeight = () => {
    const current = parseFloat(weight) || 0;
    const newValue = (current + 5).toString();
    handleWeightChange(newValue);
  };

  const decrementWeight = () => {
    const current = parseFloat(weight) || 0;
    const newValue = Math.max(0, current - 5).toString();
    handleWeightChange(newValue);
  };

  const incrementReps = () => {
    const current = parseInt(reps) || 0;
    const newValue = (current + 1).toString();
    handleRepsChange(newValue);
  };

  const decrementReps = () => {
    const current = parseInt(reps) || 0;
    const newValue = Math.max(0, current - 1).toString();
    handleRepsChange(newValue);
  };

  const formatPreviousData = () => {
    if (!previousData || (!previousData.weight && !previousData.reps)) {
      return '-';
    }

    const weightStr = previousData.weight ? `${previousData.weight}` : '0';
    const repsStr = previousData.reps ? `${previousData.reps}` : '0';
    const rpeStr = previousData.rpe ? ` @ ${previousData.rpe}` : '';

    return `${weightStr}×${repsStr}${rpeStr}`;
  };

  if (showDeleteConfirm) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-sm mb-3">Delete this set?</p>
        <div className="flex gap-2">
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
          >
            Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = set.is_completed;

  return (
    <div className={`rounded-lg p-3 transition-colors ${
      isCompleted ? 'bg-gray-800' : 'bg-gray-700'
    }`}>
      {/* Top row: Checkmark, Set number, Set type, Previous */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Checkmark Button */}
          <button
            onClick={handleToggleComplete}
            className={`w-8 h-8 flex items-center justify-center rounded border-2 transition-colors flex-shrink-0 ${
              isCompleted
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-500'
            }`}
          >
            {isCompleted ? '✓' : ''}
          </button>

          {/* Set Number */}
          <div className="text-base font-bold text-primary-400">
            Set {setNumber}
          </div>
        </div>

        {/* Previous Data */}
        <div className="text-xs text-gray-400 flex-shrink-0">
          Prev: {formatPreviousData()}
        </div>
      </div>

      {/* Set Type Selector */}
      <div className="relative mb-2">
        <button
          onClick={() => setShowSetTypeMenu(!showSetTypeMenu)}
          className={`w-full px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${
            SET_TYPE_CONFIG[set.set_type].color
          } text-white`}
        >
          <span>{SET_TYPE_CONFIG[set.set_type].icon}</span>
          <span>{SET_TYPE_CONFIG[set.set_type].label}</span>
          <span className="text-xs">▼</span>
        </button>

        {showSetTypeMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-10">
            {(Object.keys(SET_TYPE_CONFIG) as SetType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleSetTypeChange(type)}
                className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                  SET_TYPE_CONFIG[type].color
                } bg-opacity-20`}
              >
                <span>{SET_TYPE_CONFIG[type].icon}</span>
                <span>{SET_TYPE_CONFIG[type].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inputs row */}
      <div className={`flex items-center gap-2 ${isCompleted ? 'opacity-60' : ''}`}>
        {/* Weight Input */}
        <div className="flex-1 min-w-0">
          <label className="text-xs text-gray-400 block mb-1">Weight</label>
          <div className="flex items-center gap-1">
            <button
              onClick={decrementWeight}
              disabled={isCompleted}
              className="w-7 h-9 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              −
            </button>
            <input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              disabled={isCompleted}
              className="flex-1 min-w-0 px-1 py-1.5 bg-gray-800 rounded text-center text-base font-medium disabled:opacity-50"
              placeholder="0"
            />
            <button
              onClick={incrementWeight}
              disabled={isCompleted}
              className="w-7 h-9 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="flex-1 min-w-0">
          <label className="text-xs text-gray-400 block mb-1">Reps</label>
          <div className="flex items-center gap-1">
            <button
              onClick={decrementReps}
              disabled={isCompleted}
              className="w-7 h-9 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              −
            </button>
            <input
              type="number"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              disabled={isCompleted}
              className="flex-1 min-w-0 px-1 py-1.5 bg-gray-800 rounded text-center text-base font-medium disabled:opacity-50"
              placeholder="0"
            />
            <button
              onClick={incrementReps}
              disabled={isCompleted}
              className="w-7 h-9 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* RPE Input */}
        <div className="w-14 flex-shrink-0">
          <label className="text-xs text-gray-400 block mb-1">RPE</label>
          <input
            type="number"
            value={rpe}
            onChange={(e) => handleRpeChange(e.target.value)}
            disabled={isCompleted}
            className="w-full px-1 py-1.5 bg-gray-800 rounded text-center text-base font-medium disabled:opacity-50"
            placeholder="0"
            min="1"
            max="10"
            step="0.5"
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-300 text-lg mt-5 flex-shrink-0"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
