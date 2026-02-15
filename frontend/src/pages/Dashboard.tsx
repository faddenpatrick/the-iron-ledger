import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { format } from 'date-fns';
import { getWorkouts } from '../services/workout.service';
import { getMeals, getNutritionSummary } from '../services/nutrition.service';
import { WorkoutList } from '../types/workout';
import { MealList, NutritionSummary } from '../types/nutrition';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutList[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealList[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        setLoading(true);

        // Fetch today's workouts
        const workouts = await getWorkouts({
          start_date: today,
          end_date: today,
        });
        setTodayWorkouts(workouts);

        // Fetch today's meals
        const meals = await getMeals(today);
        setTodayMeals(meals);

        // Fetch nutrition summary
        try {
          const summary = await getNutritionSummary(today);
          setNutritionSummary(summary);
        } catch (error) {
          // Summary might not exist yet
          setNutritionSummary(null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, [today]);

  const calculateMacroPercentage = (current: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/workout')}
            className="btn btn-primary py-6 flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="font-semibold">Start Workout</span>
          </button>
          <button
            onClick={() => navigate('/nutrition')}
            className="btn btn-secondary py-6 flex flex-col items-center gap-2"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="font-semibold">Log Meal</span>
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-8">
            <div className="text-gray-400">Loading today's data...</div>
          </div>
        ) : (
          <>
            {/* Today's Nutrition Summary */}
            {nutritionSummary ? (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Today's Nutrition</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Calories</span>
                      <span className="font-medium">
                        {nutritionSummary.total_calories}
                        {nutritionSummary.target_calories &&
                          ` / ${nutritionSummary.target_calories}`}
                      </span>
                    </div>
                    {nutritionSummary.target_calories && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${calculateMacroPercentage(
                              nutritionSummary.total_calories,
                              nutritionSummary.target_calories
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Protein</span>
                      <span className="font-medium">
                        {nutritionSummary.total_protein}g
                        {nutritionSummary.target_protein &&
                          ` / ${nutritionSummary.target_protein}g`}
                      </span>
                    </div>
                    {nutritionSummary.target_protein && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full transition-all"
                          style={{
                            width: `${calculateMacroPercentage(
                              nutritionSummary.total_protein,
                              nutritionSummary.target_protein
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Carbs</span>
                      <span className="font-medium">
                        {nutritionSummary.total_carbs}g
                        {nutritionSummary.target_carbs &&
                          ` / ${nutritionSummary.target_carbs}g`}
                      </span>
                    </div>
                    {nutritionSummary.target_carbs && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${calculateMacroPercentage(
                              nutritionSummary.total_carbs,
                              nutritionSummary.target_carbs
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fat</span>
                      <span className="font-medium">
                        {nutritionSummary.total_fat}g
                        {nutritionSummary.target_fat &&
                          ` / ${nutritionSummary.target_fat}g`}
                      </span>
                    </div>
                    {nutritionSummary.target_fat && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-700 h-2 rounded-full transition-all"
                          style={{
                            width: `${calculateMacroPercentage(
                              nutritionSummary.total_fat,
                              nutritionSummary.target_fat
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {!nutritionSummary.target_calories && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-sm">
                    <p className="text-yellow-400">
                      ⚙ Set macro targets in Settings to track your progress
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Today's Nutrition</h3>
                <p className="text-gray-400 text-sm">
                  No meals logged today. Click "Log Meal" to start tracking!
                </p>
              </div>
            )}

            {/* Today's Workouts */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Today's Workouts</h3>
              {todayWorkouts.length > 0 ? (
                <div className="space-y-2">
                  {todayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {workout.template_name_snapshot || 'Freestyle Workout'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {format(new Date(workout.started_at), 'h:mm a')}
                            {workout.completed_at && ' • Completed'}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate('/workout')}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  No workouts today. Click "Start Workout" to begin!
                </p>
              )}
            </div>

            {/* Today's Meals */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Today's Meals</h3>
              {todayMeals.length > 0 ? (
                <div className="space-y-2">
                  {todayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{meal.category_name_snapshot}</div>
                          <div className="text-sm text-gray-400">
                            {format(new Date(meal.meal_time), 'h:mm a')}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate('/nutrition')}
                          className="text-primary-400 text-sm hover:text-primary-300"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  No meals logged today.
                </p>
              )}
            </div>

            {/* Welcome message for new users */}
            {todayWorkouts.length === 0 && todayMeals.length === 0 && (
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Welcome to The Iron Ledger!</h3>
                <p className="text-gray-300 mb-4">
                  Your personal gains ledger. Track workouts and nutrition with the strength of iron.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">⚡</span>
                    <span>Logging your first workout or creating a template</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚖</span>
                    <span>Creating meal categories and tracking nutrition</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">▦</span>
                    <span>Setting your macro targets in Settings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚙</span>
                    <span>Installing the app on your phone for offline use</span>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
