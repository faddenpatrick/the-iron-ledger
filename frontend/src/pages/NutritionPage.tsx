import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { CategorySelector } from '../components/features/nutrition/CategorySelector';
import { MealLogger } from '../components/features/nutrition/MealLogger';
import { MacroSummary } from '../components/features/nutrition/MacroSummary';
import { DailyMealList } from '../components/features/nutrition/DailyMealList';
import { useNutrition } from '../hooks/useNutrition';

export const NutritionPage: React.FC = () => {
  const [selectedDate] = useState(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { summary, loading, refresh } = useNutrition(selectedDate);

  const handleMealLogged = () => {
    refresh();
  };

  const getCategoryName = () => {
    // This is a simple placeholder - in a real app, we'd store the category name
    return 'Meal';
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Nutrition" />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* Macro Summary */}
        {loading ? (
          <div className="card text-center py-8">
            <div className="text-gray-400">Loading nutrition data...</div>
          </div>
        ) : summary ? (
          <MacroSummary summary={summary} />
        ) : null}

        {/* Category Selector */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Select Meal</h3>
          <CategorySelector
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* Meal Logger */}
        {selectedCategoryId && (
          <MealLogger
            categoryId={selectedCategoryId}
            categoryName={getCategoryName()}
            date={selectedDate}
            onMealLogged={handleMealLogged}
          />
        )}

        {/* Daily Meals */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Today's Meals</h3>
          <DailyMealList date={selectedDate} onMealDeleted={handleMealLogged} />
        </div>
      </div>
    </div>
  );
};
