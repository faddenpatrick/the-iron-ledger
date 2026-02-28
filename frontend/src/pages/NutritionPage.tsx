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
import { MeasurementsTab } from '../components/features/nutrition/MeasurementsTab';
import { SupplementsTab } from '../components/features/nutrition/SupplementsTab';
import { CheatDayToggle } from '../components/features/nutrition/CheatDayToggle';
import { useNutrition } from '../hooks/useNutrition';
import { useWeeklySummary } from '../hooks/useWeeklySummary';
import { useCheatDay } from '../hooks/useCheatDay';

type NutritionTab = 'diet' | 'measurements' | 'supplements';

const tabs = [
  { id: 'diet' as NutritionTab, label: 'Diet', icon: '🍽️' },
  { id: 'measurements' as NutritionTab, label: 'Measurements', icon: '📏' },
  { id: 'supplements' as NutritionTab, label: 'Supplements', icon: '💊' },
];

export const NutritionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NutritionTab>('diet');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { summary, loading, refresh } = useNutrition(selectedDate);
  const { summary: weeklySummary, loading: weeklyLoading, refresh: refreshWeekly } = useWeeklySummary(selectedDate);
  const { isCheatDay, loading: cheatDayLoading, toggle: toggleCheatDay } = useCheatDay(selectedDate);

  const handleMealLogged = () => {
    refresh();
  };

  const handleCheatDayToggle = async () => {
    await toggleCheatDay();
    refresh();
    refreshWeekly();
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

      {/* Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diet Tab */}
      {activeTab === 'diet' && (
        <>
          <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <CheatDayToggle
            isCheatDay={isCheatDay}
            loading={cheatDayLoading}
            onToggle={handleCheatDayToggle}
          />
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
                  <MacroSummary summary={summary} isCheatDay={isCheatDay} />
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
              <WeeklySummary summary={weeklySummary} loading={weeklyLoading} />
            )}
          </div>
        </>
      )}

      {/* Measurements Tab */}
      {activeTab === 'measurements' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <MeasurementsTab />
        </div>
      )}

      {/* Supplements Tab */}
      {activeTab === 'supplements' && <SupplementsTab />}
    </div>
  );
};
