import React, { useState, useEffect } from 'react';
import { Exercise, PreviousPerformance, PreviousSetData, TemplateExerciseRequest } from '../../../types/workout';
import { useWorkout } from '../../../hooks/useWorkout';
import { useRestTimer } from '../../../hooks/useRestTimer';
import {
  completeWorkout,
  saveWorkoutAsTemplate,
  getPreviousPerformance,
  deleteWorkout,
  getTemplate,
  updateTemplate,
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
  onCancel?: () => void;
}

interface RoutineChange {
  type: 'added' | 'removed' | 'reordered' | 'sets_changed' | 'weight_changed';
  exerciseName: string;
  detail?: string;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  workoutId,
  onComplete,
  onCancel,
}) => {
  const { workout, loading, addNewSet, updateExistingSet, removeSet } = useWorkout(workoutId);
  const restTimer = useRestTimer(60);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [previousPerformance, setPreviousPerformance] = useState<
    Record<string, PreviousPerformance>
  >({});
  const [showUpdateRoutine, setShowUpdateRoutine] = useState(false);
  const [routineChanges, setRoutineChanges] = useState<RoutineChange[]>([]);
  const [updatingRoutine, setUpdatingRoutine] = useState(false);

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

  /** Compare the workout as performed against the saved template */
  const detectRoutineChanges = async (): Promise<RoutineChange[]> => {
    if (!workout?.template_id) return [];

    try {
      const template = await getTemplate(workout.template_id);
      const changes: RoutineChange[] = [];

      // Build workout exercise order from sets
      const workoutExerciseOrder: string[] = [];
      const workoutExerciseSets: Record<string, number> = {};
      const workoutExerciseWeights: Record<string, number> = {};
      const workoutExerciseNames: Record<string, string> = {};

      for (const set of workout.sets) {
        if (!workoutExerciseOrder.includes(set.exercise_id)) {
          workoutExerciseOrder.push(set.exercise_id);
        }
        workoutExerciseSets[set.exercise_id] = (workoutExerciseSets[set.exercise_id] || 0) + 1;
        workoutExerciseNames[set.exercise_id] = set.exercise_name_snapshot;
        // Track the most common weight used (last completed set weight)
        if (set.weight && set.is_completed) {
          workoutExerciseWeights[set.exercise_id] = set.weight;
        }
      }

      // Template exercise order
      const templateExercises = [...template.exercises].sort((a, b) => a.order_index - b.order_index);
      const templateExerciseIds = templateExercises.map((te) => te.exercise_id);

      // Check for added exercises
      for (const exerciseId of workoutExerciseOrder) {
        if (!templateExerciseIds.includes(exerciseId)) {
          changes.push({
            type: 'added',
            exerciseName: workoutExerciseNames[exerciseId],
          });
        }
      }

      // Check for removed exercises
      for (const te of templateExercises) {
        if (!workoutExerciseOrder.includes(te.exercise_id)) {
          changes.push({
            type: 'removed',
            exerciseName: te.exercise.name,
          });
        }
      }

      // Check for reordering (among exercises that exist in both)
      const commonInWorkout = workoutExerciseOrder.filter((id) => templateExerciseIds.includes(id));
      const commonInTemplate = templateExerciseIds.filter((id) => workoutExerciseOrder.includes(id));
      if (commonInWorkout.length > 1 && JSON.stringify(commonInWorkout) !== JSON.stringify(commonInTemplate)) {
        changes.push({
          type: 'reordered',
          exerciseName: 'Exercise order',
          detail: 'Exercises were performed in a different order',
        });
      }

      // Check for set count changes
      for (const te of templateExercises) {
        if (!workoutExerciseOrder.includes(te.exercise_id)) continue;
        const templateSets = te.target_sets ?? 3;
        const workoutSetCount = workoutExerciseSets[te.exercise_id] || 0;
        if (workoutSetCount !== templateSets) {
          changes.push({
            type: 'sets_changed',
            exerciseName: te.exercise.name,
            detail: `${templateSets} sets → ${workoutSetCount} sets`,
          });
        }
      }

      // Check for significant weight changes
      for (const te of templateExercises) {
        if (!workoutExerciseOrder.includes(te.exercise_id)) continue;
        const templateWeight = te.target_weight ?? 0;
        const workoutWeight = workoutExerciseWeights[te.exercise_id] ?? 0;
        if (workoutWeight > 0 && templateWeight !== workoutWeight) {
          changes.push({
            type: 'weight_changed',
            exerciseName: te.exercise.name,
            detail: `${templateWeight} lbs → ${workoutWeight} lbs`,
          });
        }
      }

      return changes;
    } catch (error) {
      console.error('Failed to detect routine changes:', error);
      return [];
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;

    try {
      await completeWorkout(workout.id, new Date().toISOString());

      // If this was a template-based workout, check for changes
      if (workout.template_id) {
        const changes = await detectRoutineChanges();
        if (changes.length > 0) {
          setRoutineChanges(changes);
          setShowUpdateRoutine(true);
          return; // Don't call onComplete yet, wait for user choice
        }
      }

      onComplete();
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };

  const handleUpdateRoutine = async () => {
    if (!workout?.template_id) return;

    setUpdatingRoutine(true);
    try {
      // Build new template exercises from the workout as performed
      const exerciseOrder: string[] = [];
      const exerciseSets: Record<string, number> = {};
      const exerciseWeights: Record<string, number> = {};
      const exerciseReps: Record<string, number> = {};

      for (const set of workout.sets) {
        if (!exerciseOrder.includes(set.exercise_id)) {
          exerciseOrder.push(set.exercise_id);
        }
        exerciseSets[set.exercise_id] = (exerciseSets[set.exercise_id] || 0) + 1;
        // Use the last completed set's weight and reps as the target
        if (set.is_completed) {
          if (set.weight) exerciseWeights[set.exercise_id] = set.weight;
          if (set.reps) exerciseReps[set.exercise_id] = set.reps;
        }
      }

      const newExercises: TemplateExerciseRequest[] = exerciseOrder.map((exerciseId, index) => ({
        exercise_id: exerciseId,
        order_index: index,
        target_sets: exerciseSets[exerciseId] || 3,
        target_reps: exerciseReps[exerciseId] || 10,
        target_weight: exerciseWeights[exerciseId] || 0,
      }));

      await updateTemplate(workout.template_id, { exercises: newExercises });
      setShowUpdateRoutine(false);
      onComplete();
    } catch (error) {
      console.error('Failed to update routine:', error);
      alert('Failed to update routine. Your workout was still saved.');
      setShowUpdateRoutine(false);
      onComplete();
    } finally {
      setUpdatingRoutine(false);
    }
  };

  const handleSkipUpdate = () => {
    setShowUpdateRoutine(false);
    onComplete();
  };

  const handleSaveAsTemplate = async () => {
    if (!workout || !templateName) return;

    try {
      await saveWorkoutAsTemplate(workout.id, templateName);
      setShowSaveTemplate(false);
      setTemplateName('');
      alert('Routine saved successfully!');
    } catch (error) {
      console.error('Failed to save routine:', error);
      alert('Failed to save routine');
    }
  };

  const handleCancelWorkout = async () => {
    if (!workout) return;

    if (!confirm('Cancel this workout? All progress will be lost.')) {
      return;
    }

    try {
      await deleteWorkout(workout.id);
      if (onCancel) {
        onCancel();
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to cancel workout:', error);
      alert('Failed to cancel workout');
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
                    onComplete={() => restTimer.start()}
                    onDelete={() => removeSet(set.id)}
                  />
                ))}
            </div>
            <button
              onClick={() => handleAddSet(group.exerciseId)}
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
            Save as Routine
          </button>
        )}
        <button
          onClick={handleCompleteWorkout}
          className="w-full btn btn-primary"
        >
          Complete Workout
        </button>
        <button
          onClick={handleCancelWorkout}
          className="w-full btn bg-red-600 hover:bg-red-700 text-white"
        >
          Cancel Workout
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
            <h3 className="text-xl font-bold mb-4">Save as Routine</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Routine name"
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

      {/* Update Routine Modal */}
      {showUpdateRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Update Routine?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your workout differed from the saved &quot;{workout.template_name_snapshot}&quot; routine.
              Update it so next time it matches what you did today?
            </p>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {routineChanges.map((change, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 flex-shrink-0 ${
                    change.type === 'added' ? 'text-green-400' :
                    change.type === 'removed' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {change.type === 'added' ? '+' :
                     change.type === 'removed' ? '-' :
                     '~'}
                  </span>
                  <div>
                    <span className="font-medium">{change.exerciseName}</span>
                    {change.detail && (
                      <span className="text-gray-400 ml-1">({change.detail})</span>
                    )}
                    {!change.detail && (
                      <span className="text-gray-400 ml-1">
                        ({change.type === 'added' ? 'new exercise' :
                          change.type === 'removed' ? 'removed' :
                          'changed'})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpdateRoutine}
                disabled={updatingRoutine}
                className="flex-1 btn btn-primary"
              >
                {updatingRoutine ? 'Updating...' : 'Update Routine'}
              </button>
              <button
                onClick={handleSkipUpdate}
                className="flex-1 btn btn-secondary"
              >
                Keep Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      <RestTimer
        timeRemaining={restTimer.timeRemaining}
        isActive={restTimer.isActive}
        formatTime={restTimer.formatTime}
        start={restTimer.start}
        pause={restTimer.pause}
        resume={restTimer.resume}
        skip={restTimer.skip}
      />
    </div>
  );
};
