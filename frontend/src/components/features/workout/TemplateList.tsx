import React, { useState, useEffect, useRef } from 'react';
import { WorkoutTemplateList } from '../../../types/workout';
import { getTemplates, deleteTemplate, updateTemplate } from '../../../services/workout.service';

interface TemplateListProps {
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  workoutType?: 'lifting' | 'cardio';
}

export const TemplateList: React.FC<TemplateListProps> = ({
  onSelectTemplate,
  onCreateTemplate: _onCreateTemplate,
  workoutType = 'lifting',
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplateList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, [workoutType]);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates({ workout_type: workoutType });
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete routine:', error);
    }
  };

  const handleStartEdit = (template: WorkoutTemplateList) => {
    setEditingId(template.id);
    setEditName(template.name);
    setDeletingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await updateTemplate(editingId, { name: editName.trim() });
      setTemplates(templates.map((t) =>
        t.id === editingId ? { ...t, name: editName.trim() } : t
      ));
    } catch (error) {
      console.error('Failed to rename routine:', error);
    } finally {
      setEditingId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading routines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Routine Button */}
      <button
        onClick={_onCreateTemplate}
        className="w-full btn btn-primary py-4 text-lg"
      >
        + Create New Routine
      </button>

      {/* Routines */}
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No routines yet</p>
          <p className="text-sm text-gray-500">
            Create a routine to quickly start workouts with your favorite
            exercises
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="card">
              {deletingId === template.id ? (
                <div className="space-y-3">
                  <p className="text-sm">Delete &quot;{template.name}&quot;?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === template.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-full bg-gray-700 text-white font-semibold text-lg px-2 py-1 rounded border border-primary-500 outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEdit(template)}
                        className="text-left group"
                      >
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {template.name}
                          <span className="text-gray-500 group-hover:text-gray-300 text-sm transition-colors">✏️</span>
                        </h3>
                      </button>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => onSelectTemplate(template.id)}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => setDeletingId(template.id)}
                      className="px-4 py-2 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
