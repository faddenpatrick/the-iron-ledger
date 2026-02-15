import React, { useState, useEffect } from 'react';
import { Exercise, PreviousPerformance, PreviousSetData } from '../../../types/workout';
import { useWorkout } from '../../../hooks/useWorkout';
import { useRestTimer } from '../../../hooks/useRestTimer';
import {
  completeWorkout,
  saveWorkoutAsTemplate,
  getPreviousPerformance,
} from '../../../services/workout.service';
import { ExerciseSelector } from './ExerciseSelector';
import { SetRow } from './SetRow';
import { RestTimer } from './RestTimer';
import { PRBadge } from './PRBadge';

// Brzycki formula for 1RM calculation
const calculate1RM = (weight: number, reps: number): number => {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
};

interface WorkoutLoggerProps {
  workoutId: string;
  onComplete: () => void;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  workoutId,
  onComplete,
}) => {
  const { workout, loading, addNewSet, updateExistingSet, removeSet } = useWorkout(workoutId);
  const { start: startTimer } = useRestTimer();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [previousPerformance, setPreviousPerformance] = useState<
    Record<string, PreviousPerformance>
  >({});

  // Group sets by exercise
  const exerciseGroups = workout?.sets.reduce((acc, set) => {
    const exerciseId = set.exercise_id;
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseId,
        exerciseName: set.exercise_name_snapshot,
        sets: [],
      };
    }
    acc[exerciseId].sets.push(set);
    return acc;
  }, {} as Record<string, { exerciseId: string; exerciseName: string; sets: any[] }>);

  const exercises = exerciseGroups ? Object.values(exerciseGroups) : [];

  // Fetch previous performance for all exercises when workout loads
  useEffect(() => {
    const fetchPreviousPerformance = async () => {
      if (!workout) return;

      const exerciseIds = new Set(workout.sets.map((s) => s.exercise_id));

      for (const exerciseId of exerciseIds) {
        // Skip if already fetched
        if (previousPerformance[exerciseId]) continue;

        try {
          const previous = await getPreviousPerformance(workout.id, exerciseId);
          setPreviousPerformance((prev) => ({
            ...prev,
            [exerciseId]: previous,
          }));
        } catch (error) {
          console.error('Failed to fetch previous performance:', error);
        }
      }
    };

    fetchPreviousPerformance();
  }, [workout?.sets.length]); // Re-fetch when exercises are added

  const getPreviousSetData = (exerciseId: string, setNumber: number): PreviousSetData | null => {
    const previous = previousPerformance[exerciseId];
    if (!previous || !previous.has_previous) return null;

    // Find the matching set number, or return null
    const matchingSet = previous.previous_sets.find((s) => s.set_number === setNumber);
    return matchingSet || null;
  };

  // Calculate best 1RM for an exercise from current workout sets
  const getBest1RM = (exerciseId: string): number => {
    if (!workout) return 0;

    const exerciseSets = workout.sets.filter((s) => s.exercise_id === exerciseId);
    let best1RM = 0;

    for (const set of exerciseSets) {
      if (set.weight && set.reps) {
        const rm = calculate1RM(set.weight, set.reps);
        if (rm > best1RM) {
          best1RM = rm;
        }
      }
    }

    return best1RM;
  };

  // Calculate historical best 1RM from previous performance
  const getHistoricalBest1RM = (exerciseId: string): number => {
    const previous = previousPerformance[exerciseId];
    if (!previous || !previous.has_previous) return 0;

    let best1RM = 0;
    for (const set of previous.previous_sets) {
      if (set.weight && set.reps) {
        const rm = calculate1RM(set.weight, set.reps);
        if (rm > best1RM) {
          best1RM = rm;
        }
      }
    }

    return best1RM;
  };

  // Check if current performance is a PR
  const isPR = (exerciseId: string): boolean => {
    const current = getBest1RM(exerciseId);
    const historical = getHistoricalBest1RM(exerciseId);

    return current > 0 && historical > 0 && current > historical;
  };

  const handleAddExercise = async (exercise: Exercise) => {
    await handleAddSet(exercise.id);

    // Fetch previous performance for newly added exercise
    if (!previousPerformance[exercise.id]) {
      try {
        const previous = await getPreviousPerformance(workoutId, exercise.id);
        setPreviousPerformance((prev) => ({
          ...prev,
          [exercise.id]: previous,
        }));
      } catch (error) {
        console.error('Failed to fetch previous performance:', error);
      }
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!workout) return;

    // Count existing sets for this exercise
    const existingSets = workout.sets.filter((s) => s.exercise_id === exerciseId);
    const setNumber = existingSets.length + 1;

    try {
      await addNewSet(exerciseId, setNumber);
    } catch (error) {
      console.error('Failed to add set:', error);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;

    try {
      await completeWorkout(workout.id, new Date().toISOString());
      onComplete();
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!workout || !templateName) return;

    try {
      await saveWorkoutAsTemplate(workout.id, templateName);
      setShowSaveTemplate(false);
      setTemplateName('');
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading workout...</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Workout not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="card">
        <h2 className="text-xl font-bold mb-2">
          {workout.template_name_snapshot || 'Freestyle Workout'}
        </h2>
        <p className="text-sm text-gray-400">
          Started: {new Date(workout.started_at).toLocaleTimeString()}
        </p>
      </div>

      {/* Exercises and Sets */}
      <div className="space-y-6">
        {exercises.map((group) => {
          const best1RM = getBest1RM(group.exerciseId);
          const isPersonalRecord = isPR(group.exerciseId);

          return (
            <div key={group.exerciseId} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{group.exerciseName}</h3>
                <div className="flex items-center gap-2">
                  {best1RM > 0 && (
                    <div className="text-sm text-gray-400">
                      Est. 1RM: <span className="font-semibold text-white">{best1RM.toFixed(1)} lbs</span>
                    </div>
                  )}
                  <PRBadge isPersonalRecord={isPersonalRecord} />
                </div>
              </div>
              <div className="space-y-2 mb-3">
              {group.sets
                .sort((a, b) => a.set_number - b.set_number)
                .map((set, index) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    setNumber={index + 1}
                    previousData={getPreviousSetData(group.exerciseId, index + 1)}
                    onUpdate={(data) => updateExistingSet(set.id, data)}
                    onComplete={() => startTimer()}
                    onDelete={() => removeSet(set.id)}
                  />
                ))}
            </div>
            <button
              onClick={() => {
                handleAddSet(group.exerciseId);
                startTimer();
              }}
              className="w-full btn btn-secondary"
            >
              + Add Set
            </button>
          </div>
          );
        })}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowExerciseSelector(true)}
        className="w-full btn btn-primary py-4 text-lg"
      >
        + Add Exercise
      </button>

      {/* Actions */}
      <div className="card space-y-3">
        {!workout.template_id && (
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="w-full btn btn-secondary"
          >
            Save as Template
          </button>
        )}
        <button
          onClick={handleCompleteWorkout}
          className="w-full btn btn-primary"
        >
          Complete Workout
        </button>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Save as Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveAsTemplate}
                className="flex-1 btn btn-primary"
                disabled={!templateName}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      <RestTimer />
    </div>
  );
};
