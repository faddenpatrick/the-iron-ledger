import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { TemplateList } from '../components/features/workout/TemplateList';
import { WorkoutLogger } from '../components/features/workout/WorkoutLogger';
import { WorkoutHistory } from '../components/features/workout/WorkoutHistory';
import { WorkoutViewer } from '../components/features/workout/WorkoutViewer';
import { CardioPlaceholder } from '../components/features/workout/CardioPlaceholder';
import { TemplateBuilder } from '../components/features/workout/TemplateBuilder';
import { createWorkout, getWorkouts } from '../services/workout.service';
import { format } from 'date-fns';
import { WorkoutType } from '../types/workout';

const ACTIVE_WORKOUT_KEY = 'activeWorkoutId';

type TopTab = WorkoutType;
type SubTab = 'templates' | 'active' | 'history';

export const WorkoutPage: React.FC = () => {
  const [topTab, setTopTab] = useState<TopTab>('lifting');
  const [activeTab, setActiveTab] = useState<SubTab>('templates');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [viewingWorkoutId, setViewingWorkoutId] = useState<string | null>(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [refreshTemplates, setRefreshTemplates] = useState(0);

  // Restore active workout on mount
  useEffect(() => {
    const restoreActiveWorkout = async () => {
      // 1. Quick check: localStorage
      const savedId = localStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (savedId) {
        setActiveWorkoutId(savedId);
        setActiveTab('active');
        return;
      }

      // 2. Fallback: check for any incomplete workout from today
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const workouts = await getWorkouts({ start_date: today, end_date: today });
        const incomplete = workouts.find((w) => w.completed_at === null);
        if (incomplete) {
          localStorage.setItem(ACTIVE_WORKOUT_KEY, incomplete.id);
          setActiveWorkoutId(incomplete.id);
          setActiveTab('active');
        }
      } catch (error) {
        console.error('Failed to check for active workout:', error);
      }
    };

    restoreActiveWorkout();
  }, []);

  const handleStartFromTemplate = async (templateId: string) => {
    try {
      console.log('Starting workout from template:', templateId);

      // Create a new workout from template
      const workout = await createWorkout({
        template_id: templateId,
        workout_type: topTab,
        workout_date: format(new Date(), 'yyyy-MM-dd'),
        started_at: new Date().toISOString(),
      });

      console.log('Workout created successfully:', workout);
      localStorage.setItem(ACTIVE_WORKOUT_KEY, workout.id);
      setActiveWorkoutId(workout.id);
      setActiveTab('active');
    } catch (error: any) {
      console.error('Failed to start workout:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to start workout: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStartFreestyle = async () => {
    try {
      console.log('Starting freestyle workout with type:', topTab);

      // Create a freestyle workout (no template)
      const workout = await createWorkout({
        workout_type: topTab,
        workout_date: format(new Date(), 'yyyy-MM-dd'),
        started_at: new Date().toISOString(),
      });

      console.log('Workout created successfully:', workout);
      localStorage.setItem(ACTIVE_WORKOUT_KEY, workout.id);
      setActiveWorkoutId(workout.id);
      setActiveTab('active');
    } catch (error: any) {
      console.error('Failed to start workout:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to start workout: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCompleteWorkout = () => {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    setActiveWorkoutId(null);
    setActiveTab('templates');
  };

  const handleCancelWorkout = () => {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    setActiveWorkoutId(null);
    setActiveTab('templates');
  };

  const topTabs = [
    { id: 'lifting' as TopTab, label: 'Lifting', icon: '🏋️' },
    { id: 'cardio' as TopTab, label: 'Cardio', icon: '🏃' },
  ];

  const subTabs = [
    { id: 'templates' as SubTab, label: 'Routines', icon: '📋' },
    { id: 'active' as SubTab, label: 'Active', icon: '💪' },
    { id: 'history' as SubTab, label: 'History', icon: '📊' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <Header title="Workout" />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Tier 1: Top-level tabs (Lifting/Cardio) */}
        <div className="flex gap-3 mb-4">
          {topTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTopTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                topTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tier 2: Sub-tabs (Templates/Active/History) - only for lifting */}
        {topTab === 'lifting' && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
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
        )}

        {/* Tab Content */}
        {topTab === 'cardio' ? (
          <CardioPlaceholder />
        ) : (
          <>
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {/* Quick Start Button */}
                <button
                  onClick={handleStartFreestyle}
                  className="w-full btn btn-primary py-4 text-lg"
                >
                  🏋️ Start Freestyle Workout
                </button>

                {/* Templates */}
                <TemplateList
                  key={refreshTemplates}
                  workoutType={topTab}
                  onSelectTemplate={handleStartFromTemplate}
                  onCreateTemplate={() => setShowTemplateBuilder(true)}
                />
              </div>
            )}

            {activeTab === 'active' && (
              <>
                {activeWorkoutId ? (
                  <WorkoutLogger
                    workoutId={activeWorkoutId}
                    onComplete={handleCompleteWorkout}
                    onCancel={handleCancelWorkout}
                  />
                ) : (
                  <div className="card text-center py-8">
                    <p className="text-gray-400 mb-4">No active workout</p>
                    <button
                      onClick={handleStartFreestyle}
                      className="btn btn-primary"
                    >
                      Start Workout
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                {viewingWorkoutId ? (
                  <WorkoutViewer
                    workoutId={viewingWorkoutId}
                    onClose={() => setViewingWorkoutId(null)}
                  />
                ) : (
                  <WorkoutHistory
                    workoutType={topTab}
                    onSelectWorkout={(id) => setViewingWorkoutId(id)}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Template Builder Modal */}
        {showTemplateBuilder && (
          <TemplateBuilder
            onClose={() => setShowTemplateBuilder(false)}
            onSuccess={() => {
              setShowTemplateBuilder(false);
              setRefreshTemplates(prev => prev + 1);
            }}
          />
        )}
      </div>
    </div>
  );
};
