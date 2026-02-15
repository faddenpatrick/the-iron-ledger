import React, { useState, useEffect } from 'react';
import { Exercise } from '../../../types/workout';
import { getExercises } from '../../../services/workout.service';

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [search, selectedMuscleGroup]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await getExercises({
        search: search || undefined,
        muscle_group: selectedMuscleGroup || undefined,
      });
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-gray-800 rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Select Exercise</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="input mb-3"
            autoFocus
          />

          {/* Muscle Group Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedMuscleGroup('')}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedMuscleGroup === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              All
            </button>
            {muscleGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscleGroup(group)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedMuscleGroup === group
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No exercises found
            </div>
          ) : (
            exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => {
                  onSelect(exercise);
                  onClose();
                }}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">{exercise.name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {exercise.muscle_group && (
                    <span className="mr-3">🎯 {exercise.muscle_group}</span>
                  )}
                  {exercise.equipment && <span>🏋️ {exercise.equipment}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
