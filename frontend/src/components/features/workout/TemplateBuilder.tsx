import React, { useState, useRef, useCallback } from 'react';
import { Exercise, TemplateExercise, WorkoutTemplate } from '../../../types/workout';
import { createTemplate, updateTemplate } from '../../../services/workout.service';
import { ExerciseSelector } from './ExerciseSelector';

export interface TemplateExerciseData {
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
  /** Pass an existing template to edit it instead of creating new */
  editTemplate?: WorkoutTemplate;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  onClose,
  onSuccess,
  editTemplate,
}) => {
  const isEditing = !!editTemplate;

  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [exercises, setExercises] = useState<TemplateExerciseData[]>(() => {
    if (editTemplate?.exercises) {
      return editTemplate.exercises
        .sort((a, b) => a.order_index - b.order_index)
        .map((te: TemplateExercise, i: number) => ({
          exercise: te.exercise,
          order_index: i,
          target_sets: te.target_sets ?? 3,
          target_reps: te.target_reps ?? 10,
          target_weight: te.target_weight ?? 0,
          notes: te.notes ?? '',
        }));
    }
    return [];
  });
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartY = useRef<number>(0);
  const touchDragIndex = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
    value: number | string | Exercise
  ) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
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
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });
    setExercises(updated);
  };

  // Desktop drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...exercises];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });
    setExercises(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, exercises]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchDragIndex.current = index;
    setDragIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchDragIndex.current === null || !listRef.current) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const children = listRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        setDragOverIndex(i);
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchDragIndex.current !== null && dragOverIndex !== null && touchDragIndex.current !== dragOverIndex) {
      const updated = [...exercises];
      const [moved] = updated.splice(touchDragIndex.current, 1);
      updated.splice(dragOverIndex, 0, moved);
      updated.forEach((ex, i) => {
        ex.order_index = i;
      });
      setExercises(updated);
    }
    touchDragIndex.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragOverIndex, exercises]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a routine name');
      return;
    }

    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    setSaving(true);
    try {
      const exerciseData = exercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight: ex.target_weight,
        notes: ex.notes || undefined,
      }));

      if (isEditing && editTemplate) {
        await updateTemplate(editTemplate.id, {
          name: templateName,
          exercises: exerciseData,
        });
      } else {
        await createTemplate({
          name: templateName,
          workout_type: 'lifting',
          exercises: exerciseData,
        });
      }

      onSuccess();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} routine:`, error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} routine`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{isEditing ? 'Edit Routine' : 'Create Routine'}</h2>
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
            Routine Name
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
            <div className="space-y-3" ref={listRef}>
              {exercises.map((ex, index) => (
                <div
                  key={`${ex.exercise.id}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`card bg-gray-700 transition-all ${
                    dragIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index && dragIndex !== index
                      ? 'border-2 border-primary-500'
                      : 'border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag handle + move buttons */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div
                        className="cursor-grab active:cursor-grabbing touch-none px-1 py-2 text-gray-400 hover:text-gray-200"
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        title="Drag to reorder"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="5" cy="3" r="1.5"/>
                          <circle cx="11" cy="3" r="1.5"/>
                          <circle cx="5" cy="8" r="1.5"/>
                          <circle cx="11" cy="8" r="1.5"/>
                          <circle cx="5" cy="13" r="1.5"/>
                          <circle cx="11" cy="13" r="1.5"/>
                        </svg>
                      </div>
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
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Routine'}
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
