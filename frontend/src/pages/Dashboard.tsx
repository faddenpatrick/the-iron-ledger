import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { format, getDayOfYear } from 'date-fns';
import { getWorkouts, getWorkoutWeeklyStats } from '../services/workout.service';
import { getNutritionSummary, getWeeklySummary } from '../services/nutrition.service';
import { WorkoutList, WorkoutWeeklyStats } from '../types/workout';
import { NutritionSummary, WeeklySummary } from '../types/nutrition';
import { WeeklyStatsCard } from '../components/features/dashboard/WeeklyStatsCard';

const MOTIVATIONAL_QUOTES = [
  { text: "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.", author: "Arnold Schwarzenegger" },
  { text: "Everybody wants to be a bodybuilder, but don't nobody want to lift no heavy ass weights.", author: "Ronnie Coleman" },
  { text: "I still believe that if it's not growing, it's dying. So I'm going to keep growing.", author: "CT Fletcher" },
  { text: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.", author: "Dwayne Johnson" },
  { text: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "The only place where success comes before work is in the dictionary.", author: "Vince Lombardi" },
  { text: "The resistance that you fight physically in the gym and the resistance that you fight in life can only build a strong character.", author: "Arnold Schwarzenegger" },
  { text: "If something stands between you and your success, move it. Never be denied.", author: "Dwayne Johnson" },
  { text: "What hurts today makes you stronger tomorrow.", author: "Jay Cutler" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "Ain't nothin' to it but to do it.", author: "Ronnie Coleman" },
  { text: "No citizen has a right to be an amateur in the matter of physical training. It is a shame for one to grow old without seeing the beauty and strength of which their body is capable.", author: "Socrates" },
  { text: "The iron never lies to you. Two hundred pounds is always two hundred pounds.", author: "Henry Rollins" },
  { text: "Discipline is doing what you hate to do, but doing it like you love it.", author: "Mike Tyson" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Andrew Murphy" },
  { text: "The clock is ticking. Are you becoming the person you want to be?", author: "Greg Plitt" },
  { text: "There are no shortcuts. Everything is reps, reps, reps.", author: "Arnold Schwarzenegger" },
  { text: "When you hit failure, your workout has just begun.", author: "Ronnie Coleman" },
  { text: "To be number one, you have to train like you're number two.", author: "Maurice Greene" },
  { text: "I don't count my sit-ups. I only start counting when it starts hurting because they're the only ones that count.", author: "Muhammad Ali" },
  { text: "Some people want it to happen, some wish it would happen, others make it happen.", author: "Michael Jordan" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Strength does not come from the physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "It's supposed to be hard. If it were easy, everybody would do it.", author: "Tom Hanks" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Once you learn to quit, it becomes a habit.", author: "Vince Lombardi" },
  { text: "Light weight, baby!", author: "Ronnie Coleman" },
  { text: "The mind is the most important part. The mind is your most powerful muscle.", author: "Kai Greene" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

const getDailyQuote = () => {
  const dayIndex = getDayOfYear(new Date());
  return MOTIVATIONAL_QUOTES[dayIndex % MOTIVATIONAL_QUOTES.length];
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutList[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [weeklyNutrition, setWeeklyNutrition] = useState<WeeklySummary | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutWeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchTodayData = async () => {
    try {
      setLoading(true);

      // Fetch today's workouts
      const workouts = await getWorkouts({
        start_date: today,
        end_date: today,
      });
      setTodayWorkouts(workouts);

      // Check for active (incomplete) workout
      const activeId = localStorage.getItem('activeWorkoutId');
      const hasIncomplete = workouts.some((w) => w.completed_at === null);
      setHasActiveWorkout(!!activeId || hasIncomplete);

      // Fetch weekly stats (parallel, independent loading state)
      setWeeklyLoading(true);
      Promise.all([
        getWeeklySummary(today),
        getWorkoutWeeklyStats(today),
      ]).then(([nutrition, workout]) => {
        setWeeklyNutrition(nutrition);
        setWeeklyWorkouts(workout);
      }).catch((error) => {
        console.error('Failed to fetch weekly stats:', error);
      }).finally(() => {
        setWeeklyLoading(false);
      });

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

  // Fetch data on mount and when date changes
  useEffect(() => {
    fetchTodayData();
  }, [today]);

  // Refetch data when page becomes visible (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTodayData();
      }
    };

    const handleFocus = () => {
      fetchTodayData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => navigate('/workout')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Workout
          </button>
          <button
            onClick={() => navigate('/nutrition')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log Meal
          </button>
        </div>

        {/* Resume Active Workout Banner */}
        {hasActiveWorkout && (
          <button
            onClick={() => navigate('/workout')}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-primary-600/20 border border-primary-500/30 hover:bg-primary-600/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💪</span>
              <div className="text-left">
                <div className="font-semibold text-primary-300">Workout in Progress</div>
                <div className="text-sm text-gray-400">Tap to resume where you left off</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

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

            {/* Daily Motivation */}
            {(() => {
              const quote = getDailyQuote();
              return (
                <div className="card relative overflow-hidden">
                  <div className="absolute top-2 left-4 text-5xl text-primary-500/20 font-serif leading-none select-none">&ldquo;</div>
                  <div className="pt-6 px-2">
                    <p className="text-gray-200 italic text-base leading-relaxed">{quote.text}</p>
                    <p className="text-primary-400 text-sm mt-3 font-medium">&mdash; {quote.author}</p>
                  </div>
                </div>
              );
            })()}

            {/* Weekly Stats */}
            <WeeklyStatsCard
              nutritionStats={weeklyNutrition}
              workoutStats={weeklyWorkouts}
              loading={weeklyLoading}
            />

            {/* Welcome message for new users */}
            {todayWorkouts.length === 0 && (!nutritionSummary || nutritionSummary.total_calories === 0) && (
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Welcome to The Iron Ledger!</h3>
                <p className="text-gray-300 mb-4">
                  Your personal gains ledger. Track workouts and nutrition with the strength of iron.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">⚡</span>
                    <span>Logging your first workout or creating a routine</span>
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
