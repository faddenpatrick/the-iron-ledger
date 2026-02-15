import React, { useState } from 'react';
import { Exercise } from '../../../types/workout';
import { createTemplate } from '../../../services/workout.service';
import { ExerciseSelector } from './ExerciseSelector';

interface TemplateExerciseData {
  exercise: Exercise;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  notes: string;
}

interface TemplateBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  onClose,
  onSuccess,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [exercises, setExercises] = useState<TemplateExerciseData[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: TemplateExerciseData = {
      exercise,
      order_index: exercises.length,
      target_sets: 3,
      target_reps: 10,
      target_weight: 0,
      notes: '',
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (
    index: number,
    field: keyof TemplateExerciseData,
    value: any
  ) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    // Re-index remaining exercises
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });
    setExercises(updated);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return;
    }

    const updated = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    // Update order_index
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });

    setExercises(updated);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    setSaving(true);
    try {
      await createTemplate({
        name: templateName,
        workout_type: 'lifting',
        exercises: exercises.map((ex) => ({
          exercise_id: ex.exercise.id,
          order_index: ex.order_index,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_weight: ex.target_weight,
          notes: ex.notes || undefined,
        })),
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Template Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Push Day, Leg Day, Full Body"
            className="input w-full"
            autoFocus
          />
        </div>

        {/* Exercises */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">Exercises</label>
            <button
              onClick={() => setShowExerciseSelector(true)}
              className="btn btn-secondary text-sm"
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-2">No exercises added yet</p>
              <p className="text-sm">Click &quot;Add Exercise&quot; to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex, index) => (
                <div key={index} className="card bg-gray-700">
                  <div className="flex items-start gap-3">
                    {/* Move buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-30 rounded"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-30 rounded"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Exercise details */}
                    <div className="flex-1">
                      <div className="font-semibold mb-2">
                        {index + 1}. {ex.exercise.name}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-400">Sets</label>
                          <input
                            type="number"
                            value={ex.target_sets}
                            onChange={(e) =>
                              handleUpdateExercise(
                                index,
                                'target_sets',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="input w-full text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Reps</label>
                          <input
                            type="number"
                            value={ex.target_reps}
                            onChange={(e) =>
                              handleUpdateExercise(
                                index,
                                'target_reps',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="input w-full text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Weight (lbs)
                          </label>
                          <input
                            type="number"
                            value={ex.target_weight}
                            onChange={(e) =>
                              handleUpdateExercise(
                                index,
                                'target_weight',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="input w-full text-sm"
                            min="0"
                            step="5"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={ex.notes}
                          onChange={(e) =>
                            handleUpdateExercise(index, 'notes', e.target.value)
                          }
                          placeholder="e.g., Focus on form, increase weight next time"
                          className="input w-full text-sm"
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="px-3 py-1 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !templateName || exercises.length === 0}
            className="flex-1 btn btn-primary"
          >
            {saving ? 'Saving...' : 'Create Template'}
          </button>
          <button onClick={onClose} className="flex-1 btn btn-secondary">
            Cancel
          </button>
        </div>

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <ExerciseSelector
            onSelect={handleAddExercise}
            onClose={() => setShowExerciseSelector(false)}
          />
        )}
      </div>
    </div>
  );
};
