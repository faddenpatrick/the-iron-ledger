import React, { useState } from 'react';
import { Set } from '../../../types/workout';

interface SetRowProps {
  set: Set;
  setNumber: number;
  onUpdate: (data: { weight?: number; reps?: number; rpe?: number }) => void;
  onDelete: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  setNumber,
  onUpdate,
  onDelete,
}) => {
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [rpe, setRpe] = useState(set.rpe?.toString() || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleWeightChange = (value: string) => {
    setWeight(value);
    const numValue = value ? parseFloat(value) : undefined;
    onUpdate({ weight: numValue, reps: set.reps || undefined, rpe: set.rpe || undefined });
  };

  const handleRepsChange = (value: string) => {
    setReps(value);
    const numValue = value ? parseInt(value) : undefined;
    onUpdate({ weight: set.weight || undefined, reps: numValue, rpe: set.rpe || undefined });
  };

  const handleRpeChange = (value: string) => {
    setRpe(value);
    const numValue = value ? parseFloat(value) : undefined;
    onUpdate({ weight: set.weight || undefined, reps: set.reps || undefined, rpe: numValue });
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

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        {/* Set Number */}
        <div className="text-lg font-bold text-primary-400 w-8">
          {setNumber}
        </div>

        {/* Weight Input */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Weight (lbs)</label>
          <div className="flex items-center gap-1">
            <button
              onClick={decrementWeight}
              className="w-8 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-lg"
            >
              −
            </button>
            <input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="flex-1 px-2 py-2 bg-gray-800 rounded text-center text-lg font-medium"
              placeholder="0"
            />
            <button
              onClick={incrementWeight}
              className="w-8 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Reps</label>
          <div className="flex items-center gap-1">
            <button
              onClick={decrementReps}
              className="w-8 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-lg"
            >
              −
            </button>
            <input
              type="number"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              className="flex-1 px-2 py-2 bg-gray-800 rounded text-center text-lg font-medium"
              placeholder="0"
            />
            <button
              onClick={incrementReps}
              className="w-8 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* RPE Input */}
        <div className="w-16">
          <label className="text-xs text-gray-400 block mb-1">RPE</label>
          <input
            type="number"
            value={rpe}
            onChange={(e) => handleRpeChange(e.target.value)}
            className="w-full px-2 py-2 bg-gray-800 rounded text-center text-lg font-medium"
            placeholder="0"
            min="1"
            max="10"
            step="0.5"
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 text-xl"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
