import React, { useState, useEffect } from 'react';
import { MealList } from '../../../types/nutrition';
import { getMeals, deleteMeal, copyMeal } from '../../../services/nutrition.service';
import { format, isToday } from 'date-fns';
import { MealDetailViewer } from './MealDetailViewer';

interface DailyMealListProps {
  date: Date;
  onMealDeleted: () => void;
}

export const DailyMealList: React.FC<DailyMealListProps> = ({
  date,
  onMealDeleted,
}) => {
  const [meals, setMeals] = useState<MealList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingMealId, setViewingMealId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const isTodayDate = isToday(date);

  useEffect(() => {
    loadMeals();
  }, [dateStr]);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const data = await getMeals(dateStr);
      setMeals(data);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeal(id);
      setMeals(meals.filter((m) => m.id !== id));
      setDeletingId(null);
      onMealDeleted();
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  const handleCopyToToday = async (id: string) => {
    try {
      const now = new Date();
      const todayDateStr = format(now, 'yyyy-MM-dd');
      const timeStr = now.toISOString();

      await copyMeal(id, todayDateStr, timeStr);
      setCopyingId(null);
      alert('Meal copied to today!');
      onMealDeleted(); // Refresh the list
    } catch (error) {
      console.error('Failed to copy meal:', error);
      alert('Failed to copy meal');
    }
  };

  const handleMealUpdated = () => {
    loadMeals();
    onMealDeleted();
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        Loading meals...
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">No meals logged today</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div key={meal.id} className="card">
            {deletingId === meal.id ? (
              <div className="space-y-3">
                <p className="text-sm">Delete this meal?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : copyingId === meal.id ? (
              <div className="space-y-3">
                <p className="text-sm">Copy &quot;{meal.category_name_snapshot}&quot; to today?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyToToday(meal.id)}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setCopyingId(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{meal.category_name_snapshot}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {format(new Date(meal.meal_time), 'h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingMealId(meal.id)}
                    className="px-3 py-1 text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    View
                  </button>
                  {!isTodayDate && (
                    <button
                      onClick={() => setCopyingId(meal.id)}
                      className="px-3 py-1 text-brand-gold hover:text-primary-300 text-sm font-medium"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    onClick={() => setDeletingId(meal.id)}
                    className="px-3 py-1 text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meal Detail Viewer Modal */}
      {viewingMealId && (
        <MealDetailViewer
          mealId={viewingMealId}
          onClose={() => setViewingMealId(null)}
          onUpdate={handleMealUpdated}
        />
      )}
    </>
  );
};
