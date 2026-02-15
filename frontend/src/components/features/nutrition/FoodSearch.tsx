import React, { useState, useEffect } from 'react';
import { Food } from '../../../types/nutrition';
import { getFoods } from '../../../services/nutrition.service';

interface FoodSearchProps {
  onSelect: (food: Food) => void;
  onClose: () => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect, onClose }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoods();
  }, [search]);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const data = await getFoods(search || undefined);
      setFoods(data);
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-gray-800 rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Select Food</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search foods..."
            className="input"
            autoFocus
          />
        </div>

        {/* Food List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : foods.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No foods found</div>
          ) : (
            foods.map((food) => (
              <button
                key={food.id}
                onClick={() => {
                  onSelect(food);
                  onClose();
                }}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium mb-1">{food.name}</div>
                <div className="text-sm text-gray-400">
                  {food.serving_size} - {food.calories} cal
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
