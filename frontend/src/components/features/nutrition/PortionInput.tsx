import React, { useState } from 'react';
import { Food } from '../../../types/nutrition';

interface PortionInputProps {
  food: Food;
  onAdd: (servings: number) => void;
  onCancel: () => void;
  initialServings?: number;
  buttonLabel?: string;
}

export const PortionInput: React.FC<PortionInputProps> = ({
  food,
  onAdd,
  onCancel,
  initialServings = 1,
  buttonLabel = 'Add to Meal',
}) => {
  const [servings, setServings] = useState(initialServings.toString());

  const servingsNum = parseFloat(servings) || 0;

  const totalCalories = Math.round(food.calories * servingsNum);
  const totalProtein = Math.round(food.protein * servingsNum);
  const totalCarbs = Math.round(food.carbs * servingsNum);
  const totalFat = Math.round(food.fat * servingsNum);

  const increment = () => {
    const current = parseFloat(servings) || 0;
    setServings((current + 0.5).toString());
  };

  const decrement = () => {
    const current = parseFloat(servings) || 0;
    if (current > 0.5) {
      setServings((current - 0.5).toString());
    }
  };

  const handleAdd = () => {
    if (servingsNum > 0) {
      onAdd(servingsNum);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2 break-words">{food.name}</h3>
        <p className="text-sm text-gray-400 mb-6 break-words">{food.serving_size} per serving</p>

        {/* Servings Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">Servings</label>
          <div className="flex items-center gap-2">
            <button
              onClick={decrement}
              className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="flex-1 min-w-0 px-3 py-3 bg-gray-700 rounded-lg text-center text-xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step="0.5"
              min="0"
            />
            <button
              onClick={increment}
              className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Nutritional Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Calories</span>
            <span className="font-bold">{totalCalories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Protein</span>
            <span className="font-medium">{totalProtein}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Carbs</span>
            <span className="font-medium">{totalCarbs}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fat</span>
            <span className="font-medium">{totalFat}g</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex-1 btn btn-primary"
            disabled={servingsNum <= 0}
          >
            {buttonLabel}
          </button>
          <button onClick={onCancel} className="flex-1 btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
