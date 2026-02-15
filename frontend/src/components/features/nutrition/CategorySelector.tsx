import React, { useState, useEffect } from 'react';
import { MealCategory } from '../../../types/nutrition';
import { getMealCategories, createMealCategory } from '../../../services/nutrition.service';

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
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          + New
        </button>
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
