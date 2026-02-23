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
import { useNutrition } from '../hooks/useNutrition';
import { useWeeklySummary } from '../hooks/useWeeklySummary';

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

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Tab Bar */}
        <div className="flex gap-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Diet Tab */}
        {activeTab === 'diet' && (
          <>
            {/* Date Navigation */}
            <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

            {/* View Mode Toggle */}
            <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />

            <div className="space-y-6 mt-4">
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
          </>
        )}

        {/* Measurements Tab */}
        {activeTab === 'measurements' && <MeasurementsTab />}

        {/* Supplements Tab */}
        {activeTab === 'supplements' && <SupplementsTab />}
      </div>
    </div>
  );
};
