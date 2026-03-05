import React, { useState, useEffect, useCallback } from 'react';
import { Meal, MealCategory, MealItem as MealItemType, Food } from '../../../types/nutrition';
import { getMeal, getMealCategories, updateMealType, deleteMealItem, addMealItem, createFood, updateMealItemServings } from '../../../services/nutrition.service';
import { format } from 'date-fns';
import { FoodSearch } from './FoodSearch';
import { PortionInput } from './PortionInput';

interface MealDetailViewerProps {
  mealId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const MealDetailViewer: React.FC<MealDetailViewerProps> = ({
  mealId,
  onClose,
  onUpdate,
}) => {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showPortionInput, setShowPortionInput] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MealItemType | null>(null);
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getMealCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadMeal = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeal(mealId);
      setMeal(data);
    } catch (error) {
      console.error('Failed to load meal:', error);
    } finally {
      setLoading(false);
    }
  }, [mealId]);

  useEffect(() => {
    loadMeal();
    loadCategories();
  }, [loadMeal, loadCategories]);

  const handleCategoryChange = async (categoryId: string) => {
    if (!meal || categoryId === meal.category_id) {
      setEditingCategory(false);
      return;
    }

    setUpdatingCategory(true);
    try {
      const updatedMeal = await updateMealType(meal.id, categoryId);
      setMeal(updatedMeal);
      setEditingCategory(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update meal category:', error);
      alert('Failed to update meal type');
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMealItem(itemId);
      // Reload the meal to get updated items
      await loadMeal();
      setDeletingItemId(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete meal item:', error);
      alert('Failed to delete item');
    }
  };

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setShowFoodSearch(false);
    setShowPortionInput(true);
  };

  const handleAddFood = async (servings: number) => {
    if (!selectedFood || !meal) return;

    setAddingItem(true);
    try {
      let foodId = selectedFood.id;

      // Check if this is an OpenFoodFacts food that needs to be saved
      if ('_source' in selectedFood && selectedFood._source === 'openfoodfacts') {
        // Save to database first
        const savedFood = await createFood({
          name: selectedFood.name,
          serving_size: selectedFood.serving_size,
          calories: selectedFood.calories,
          protein: selectedFood.protein,
          carbs: selectedFood.carbs,
          fat: selectedFood.fat,
        });
        foodId = savedFood.id;
      }

      await addMealItem(meal.id, foodId, servings);
      // Reload the meal to get updated items
      await loadMeal();
      setSelectedFood(null);
      setShowPortionInput(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to add meal item:', error);
      alert('Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleEditServings = async (servings: number) => {
    if (!editingItem) return;

    try {
      await updateMealItemServings(editingItem.id, servings);
      await loadMeal();
      setEditingItem(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update servings:', error);
      alert('Failed to update servings');
    }
  };

  // Calculate total macros
  const totals = meal?.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories_snapshot * item.servings,
      protein: acc.protein + item.protein_snapshot * item.servings,
      carbs: acc.carbs + item.carbs_snapshot * item.servings,
      fat: acc.fat + item.fat_snapshot * item.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6">
          <div className="text-center py-8">
            <div className="text-gray-400">Loading meal...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!meal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            {editingCategory ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    disabled={updatingCategory}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      cat.id === meal.category_id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${updatingCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
                <button
                  onClick={() => setEditingCategory(false)}
                  disabled={updatingCategory}
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCategory(true)}
                className="text-xl font-bold hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                {meal.category_name_snapshot}
                <span className="text-sm text-gray-400 font-normal">edit</span>
              </button>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {format(new Date(meal.meal_time), 'EEEE, MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Macro Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{Math.round(totals.calories)}</div>
            <div className="text-xs text-gray-400">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-300">{Math.round(totals.protein)}g</div>
            <div className="text-xs text-gray-400">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">{Math.round(totals.carbs)}g</div>
            <div className="text-xs text-gray-400">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{Math.round(totals.fat)}g</div>
            <div className="text-xs text-gray-400">Fat</div>
          </div>
        </div>

        {/* Food Items */}
        <div className="space-y-3">
          <h3 className="font-semibold">Food Items</h3>
          {meal.items.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No items in this meal</p>
            </div>
          ) : (
            meal.items.map((item) => (
              <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                {deletingItemId === item.id ? (
                  <div className="space-y-3">
                    <p className="text-sm">Delete &quot;{item.food_name_snapshot}&quot;?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingItemId(null)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <button
                      className="flex-1 text-left"
                      onClick={() => setEditingItem(item)}
                    >
                      <h4 className="font-medium">{item.food_name_snapshot}</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.servings} serving{item.servings !== 1 ? 's' : ''} · tap to edit
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-blue-400">
                          {Math.round(item.calories_snapshot * item.servings)} cal
                        </span>
                        <span className="text-gray-300">
                          P: {Math.round(item.protein_snapshot * item.servings)}g
                        </span>
                        <span className="text-amber-400">
                          C: {Math.round(item.carbs_snapshot * item.servings)}g
                        </span>
                        <span className="text-yellow-600">
                          F: {Math.round(item.fat_snapshot * item.servings)}g
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            onClick={() => setShowFoodSearch(true)}
            className="w-full btn btn-primary"
            disabled={addingItem}
          >
            + Add Food Item
          </button>
          <button
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Modals */}
      {showFoodSearch && (
        <FoodSearch
          onSelect={handleFoodSelect}
          onClose={() => setShowFoodSearch(false)}
        />
      )}

      {showPortionInput && selectedFood && (
        <PortionInput
          food={selectedFood}
          onAdd={handleAddFood}
          onCancel={() => {
            setShowPortionInput(false);
            setSelectedFood(null);
          }}
        />
      )}

      {editingItem && (
        <PortionInput
          food={{
            id: editingItem.food_id,
            name: editingItem.food_name_snapshot,
            serving_size: '',
            calories: editingItem.calories_snapshot,
            protein: editingItem.protein_snapshot,
            carbs: editingItem.carbs_snapshot,
            fat: editingItem.fat_snapshot,
            is_custom: false,
            user_id: null,
            created_at: '',
            updated_at: '',
          }}
          initialServings={editingItem.servings}
          buttonLabel="Update Servings"
          onAdd={handleEditServings}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};
