import React, { useState, useEffect } from 'react';
import { Meal } from '../../../types/nutrition';
import { getMeal, deleteMealItem } from '../../../services/nutrition.service';
import { format } from 'date-fns';

interface MealDetailViewerProps {
  mealId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const MealDetailViewer: React.FC<MealDetailViewerProps> = ({
  mealId,
  onClose,
  onUpdate,
}) => {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    loadMeal();
  }, [mealId]);

  const loadMeal = async () => {
    setLoading(true);
    try {
      const data = await getMeal(mealId);
      setMeal(data);
    } catch (error) {
      console.error('Failed to load meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMealItem(itemId);
      // Reload the meal to get updated items
      await loadMeal();
      setDeletingItemId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete meal item:', error);
      alert('Failed to delete item');
    }
  };

  // Calculate total macros
  const totals = meal?.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories_snapshot * item.servings,
      protein: acc.protein + item.protein_snapshot * item.servings,
      carbs: acc.carbs + item.carbs_snapshot * item.servings,
      fat: acc.fat + item.fat_snapshot * item.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6">
          <div className="text-center py-8">
            <div className="text-gray-400">Loading meal...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!meal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{meal.category_name_snapshot}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {format(new Date(meal.meal_time), 'EEEE, MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Macro Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{Math.round(totals.calories)}</div>
            <div className="text-xs text-gray-400">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-300">{Math.round(totals.protein)}g</div>
            <div className="text-xs text-gray-400">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">{Math.round(totals.carbs)}g</div>
            <div className="text-xs text-gray-400">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{Math.round(totals.fat)}g</div>
            <div className="text-xs text-gray-400">Fat</div>
          </div>
        </div>

        {/* Food Items */}
        <div className="space-y-3">
          <h3 className="font-semibold">Food Items</h3>
          {meal.items.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No items in this meal</p>
            </div>
          ) : (
            meal.items.map((item) => (
              <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                {deletingItemId === item.id ? (
                  <div className="space-y-3">
                    <p className="text-sm">Delete &quot;{item.food_name_snapshot}&quot;?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingItemId(null)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.food_name_snapshot}</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.servings} serving{item.servings !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-blue-400">
                          {Math.round(item.calories_snapshot * item.servings)} cal
                        </span>
                        <span className="text-gray-300">
                          P: {Math.round(item.protein_snapshot * item.servings)}g
                        </span>
                        <span className="text-amber-400">
                          C: {Math.round(item.carbs_snapshot * item.servings)}g
                        </span>
                        <span className="text-yellow-600">
                          F: {Math.round(item.fat_snapshot * item.servings)}g
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
