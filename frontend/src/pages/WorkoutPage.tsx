import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { TemplateList } from '../components/features/workout/TemplateList';
import { WorkoutLogger } from '../components/features/workout/WorkoutLogger';
import { WorkoutHistory } from '../components/features/workout/WorkoutHistory';
import { CardioPlaceholder } from '../components/features/workout/CardioPlaceholder';
import { createWorkout } from '../services/workout.service';
import { format } from 'date-fns';
import { WorkoutType } from '../types/workout';

type TopTab = WorkoutType;
type SubTab = 'templates' | 'active' | 'history';

export const WorkoutPage: React.FC = () => {
  const [topTab, setTopTab] = useState<TopTab>('lifting');
  const [activeTab, setActiveTab] = useState<SubTab>('templates');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  const handleStartFromTemplate = async (templateId: string) => {
    try {
      // Create a new workout from template
      const workout = await createWorkout({
        template_id: templateId,
        workout_type: topTab,
        workout_date: format(new Date(), 'yyyy-MM-dd'),
        started_at: new Date().toISOString(),
      });

      setActiveWorkoutId(workout.id);
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to start workout:', error);
      alert('Failed to start workout');
    }
  };

  const handleStartFreestyle = async () => {
    try {
      // Create a freestyle workout (no template)
      const workout = await createWorkout({
        workout_type: topTab,
        workout_date: format(new Date(), 'yyyy-MM-dd'),
        started_at: new Date().toISOString(),
      });

      setActiveWorkoutId(workout.id);
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to start workout:', error);
      alert('Failed to start workout');
    }
  };

  const handleCompleteWorkout = () => {
    setActiveWorkoutId(null);
    setActiveTab('templates');
  };

  const topTabs = [
    { id: 'lifting' as TopTab, label: 'Lifting', icon: '🏋️' },
    { id: 'cardio' as TopTab, label: 'Cardio', icon: '🏃' },
  ];

  const subTabs = [
    { id: 'templates' as SubTab, label: 'Templates', icon: '📋' },
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
                  workoutType={topTab}
                  onSelectTemplate={handleStartFromTemplate}
                  onCreateTemplate={() => {
                    alert('Template builder coming in next update!');
                  }}
                />
              </div>
            )}

            {activeTab === 'active' && (
              <>
                {activeWorkoutId ? (
                  <WorkoutLogger
                    workoutId={activeWorkoutId}
                    onComplete={handleCompleteWorkout}
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
              <WorkoutHistory
                workoutType={topTab}
                onSelectWorkout={(id) => {
                  setActiveWorkoutId(id);
                  setActiveTab('active');
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
