import React, { useState, useEffect } from 'react';
import { WorkoutTemplateList } from '../../../types/workout';
import { getTemplates, deleteTemplate } from '../../../services/workout.service';

interface TemplateListProps {
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  onSelectTemplate,
  onCreateTemplate,
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplateList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
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
      console.error('Failed to delete template:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Template Button - Hidden for now, use "Save as Template" after workouts */}
      {/*
      <button
        onClick={onCreateTemplate}
        className="w-full btn btn-primary py-4 text-lg"
      >
        + Create New Template
      </button>
      */}

      {/* Templates */}
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No templates yet</p>
          <p className="text-sm text-gray-500">
            Create a template to quickly start workouts with your favorite
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
