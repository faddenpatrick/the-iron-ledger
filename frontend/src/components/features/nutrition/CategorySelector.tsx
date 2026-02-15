import React, { useState, useEffect } from 'react';
import { MealCategory } from '../../../types/nutrition';
import { getMealCategories, createMealCategory, updateMealCategory, deleteMealCategory } from '../../../services/nutrition.service';

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [manageMode, setManageMode] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getMealCategories();
      setCategories(data);

      // Auto-select first category if none selected
      if (!selectedCategoryId && data.length > 0) {
        onSelectCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createMealCategory({
        name: newCategoryName,
        display_order: categories.length,
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowCreateModal(false);
      onSelectCategory(newCategory.id);
    } catch (error: any) {
      console.error('Failed to create category:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Unknown error';
      alert(`Failed to create category: ${errorMsg}`);
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editName.trim()) return;

    try {
      await updateMealCategory(id, { name: editName });
      setCategories(categories.map(cat =>
        cat.id === id ? { ...cat, name: editName } : cat
      ));
      setEditingId(null);
      setEditName('');
    } catch (error: any) {
      console.error('Failed to update category:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Unknown error';
      alert(`Failed to update category: ${errorMsg}`);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" category? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteMealCategory(id);
      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);

      // If deleted category was selected, select first remaining category
      if (selectedCategoryId === id && updatedCategories.length > 0) {
        onSelectCategory(updatedCategories[0].id);
      }
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Unknown error';
      alert(`Failed to delete category: ${errorMsg}`);
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading categories...</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-400 mb-4">No meal categories yet</p>
        <p className="text-sm text-gray-500 mb-4">
          Create categories like "Breakfast", "Lunch", "Dinner", "Snacks"
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Create First Category
        </button>
        {showCreateModal && (
          <CreateCategoryModal
            value={newCategoryName}
            onChange={setNewCategoryName}
            onCreate={handleCreateCategory}
            onCancel={() => {
              setShowCreateModal(false);
              setNewCategoryName('');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setManageMode(!manageMode)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {manageMode ? '✓ Done' : '⚙ Manage'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map((category) => (
          <div key={category.id} className="relative">
            {editingId === category.id ? (
              <div className="flex items-center gap-1 bg-gray-700 rounded-full px-2 py-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleEditCategory(category.id);
                    if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                  }}
                  className="bg-transparent text-sm px-2 py-1 w-32 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleEditCategory(category.id)}
                  className="text-green-500 text-xs px-2"
                >
                  ✓
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditName(''); }}
                  className="text-red-500 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => !manageMode && onSelectCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryId === category.id && !manageMode
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
                {manageMode && (
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(category.id);
                        setEditName(category.name);
                      }}
                      className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {!manageMode && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            + New
          </button>
        )}
      </div>

      {showCreateModal && (
        <CreateCategoryModal
          value={newCategoryName}
          onChange={setNewCategoryName}
          onCreate={handleCreateCategory}
          onCancel={() => {
            setShowCreateModal(false);
            setNewCategoryName('');
          }}
        />
      )}
    </div>
  );
};

interface CreateCategoryModalProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  value,
  onChange,
  onCreate,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Create Meal Category</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Breakfast, Lunch, Dinner"
          className="input mb-4"
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onCreate();
            }
          }}
        />
        <div className="flex gap-2">
          <button onClick={onCreate} className="flex-1 btn btn-primary" disabled={!value.trim()}>
            Create
          </button>
          <button onClick={onCancel} className="flex-1 btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
