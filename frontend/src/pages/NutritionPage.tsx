import React, { useState } from 'react';
import { format, isToday } from 'date-fns';
import { Header } from '../components/layout/Header';
import DateNavigation from '../components/features/nutrition/DateNavigation';
import ViewModeToggle from '../components/features/nutrition/ViewModeToggle';
import { CategorySelector } from '../components/features/nutrition/CategorySelector';
import { MealLogger } from '../components/features/nutrition/MealLogger';
import { MacroSummary } from '../components/features/nutrition/MacroSummary';
import { WeeklySummary } from '../components/features/nutrition/WeeklySummary';
import { DailyMealList } from '../components/features/nutrition/DailyMealList';
import { useNutrition } from '../hooks/useNutrition';
import { useWeeklySummary } from '../hooks/useWeeklySummary';

export const NutritionPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { summary, loading, refresh } = useNutrition(selectedDate);
  const { summary: weeklySummary, loading: weeklyLoading } = useWeeklySummary(selectedDate);

  const handleMealLogged = () => {
    refresh();
  };

  const getCategoryName = () => {
    // This is a simple placeholder - in a real app, we'd store the category name
    return 'Meal';
  };

  const dateHeading = isToday(selectedDate)
    ? "Today's Meals"
    : `Meals for ${format(selectedDate, 'EEE, MMM d')}`;

  return (
    <div className="min-h-screen pb-20">
      <Header title="Nutrition" />

      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* View Mode Toggle */}
      <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {viewMode === 'today' ? (
          <>
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
              <h3 className="text-lg font-semibold mb-3">{dateHeading}</h3>
              <DailyMealList date={selectedDate} onMealDeleted={handleMealLogged} />
            </div>
          </>
        ) : (
          /* Weekly Summary View */
          <WeeklySummary summary={weeklySummary} loading={weeklyLoading} />
        )}
      </div>
    </div>
  );
};
