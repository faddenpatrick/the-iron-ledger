import React, { useState, useEffect } from 'react';
import { Food } from '../../../types/nutrition';
import { getFoods, createFood } from '../../../services/nutrition.service';

interface FoodSearchProps {
  onSelect: (food: Food) => void;
  onClose: () => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect, onClose }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    serving_size: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

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

  const handleCreateCustomFood = async () => {
    try {
      const newFood = await createFood({
        name: customFood.name,
        serving_size: customFood.serving_size,
        calories: parseInt(customFood.calories) || 0,
        protein: parseInt(customFood.protein) || 0,
        carbs: parseInt(customFood.carbs) || 0,
        fat: parseInt(customFood.fat) || 0,
      });
      onSelect(newFood);
      onClose();
    } catch (error: any) {
      console.error('Failed to create food:', error);
      alert(error?.response?.data?.detail || 'Failed to create custom food');
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

          {/* Create Custom Food Button */}
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="mt-3 w-full btn btn-secondary text-sm"
          >
            {showCustomForm ? '← Back to Search' : '+ Create Custom Food'}
          </button>
        </div>

        {/* Food List or Custom Food Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {showCustomForm ? (
            /* Custom Food Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Food Name</label>
                <input
                  type="text"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  placeholder="e.g., Homemade Protein Shake"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Serving Size</label>
                <input
                  type="text"
                  value={customFood.serving_size}
                  onChange={(e) => setCustomFood({ ...customFood, serving_size: e.target.value })}
                  placeholder="e.g., 1 cup, 250g"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={customFood.protein}
                    onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={customFood.carbs}
                    onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={customFood.fat}
                    onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateCustomFood}
                disabled={!customFood.name || !customFood.serving_size}
                className="btn btn-primary w-full"
              >
                Add Custom Food
              </button>
            </div>
          ) : (
            /* Search Results */
            loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : foods.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No foods found</p>
                <p className="text-sm mt-2">Try creating a custom food instead</p>
              </div>
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
            )
          )}
        </div>
      </div>
    </div>
  );
};
