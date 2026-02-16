import React, { useState } from 'react';
import { Food } from '../../../types/nutrition';
import { createMeal, createFood } from '../../../services/nutrition.service';
import { FoodSearch } from './FoodSearch';
import { PortionInput } from './PortionInput';
import { format } from 'date-fns';

interface MealLoggerProps {
  categoryId: string;
  categoryName: string;
  date: Date;
  onMealLogged: () => void;
}

interface FoodItem {
  food: Food;
  servings: number;
}

export const MealLogger: React.FC<MealLoggerProps> = ({
  categoryId,
  categoryName,
  date,
  onMealLogged,
}) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showPortionInput, setShowPortionInput] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [logging, setLogging] = useState(false);

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setShowPortionInput(true);
  };

  const handleAddFood = (servings: number) => {
    if (!selectedFood) return;

    setFoodItems([...foodItems, { food: selectedFood, servings }]);
    setSelectedFood(null);
    setShowPortionInput(false);
  };

  const handleRemoveFood = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    return foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.food.calories * item.servings,
        protein: acc.protein + item.food.protein * item.servings,
        carbs: acc.carbs + item.food.carbs * item.servings,
        fat: acc.fat + item.food.fat * item.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleLogMeal = async () => {
    if (foodItems.length === 0) return;

    setLogging(true);
    try {
      // First, save any OpenFoodFacts foods to the database
      const processedItems = await Promise.all(
        foodItems.map(async (item) => {
          let foodId = item.food.id;

          // Check if this is an OpenFoodFacts food that needs to be saved
          if ((item.food as any)._source === 'openfoodfacts') {
            // Save to database first
            const savedFood = await createFood({
              name: item.food.name,
              serving_size: item.food.serving_size,
              calories: item.food.calories,
              protein: item.food.protein,
              carbs: item.food.carbs,
              fat: item.food.fat,
            });
            foodId = savedFood.id;
          }

          return {
            food_id: foodId,
            servings: item.servings,
          };
        })
      );

      await createMeal({
        category_id: categoryId,
        meal_date: format(date, 'yyyy-MM-dd'),
        meal_time: new Date().toISOString(),
        items: processedItems,
      });

      setFoodItems([]);
      onMealLogged();
    } catch (error) {
      console.error('Failed to log meal:', error);
      alert('Failed to log meal');
    } finally {
      setLogging(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Log {categoryName}</h3>

      {/* Food Items */}
      {foodItems.length > 0 && (
        <div className="space-y-2 mb-4">
          {foodItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium break-words">{item.food.name}</div>
                <div className="text-sm text-gray-400 break-words">
                  {item.servings} × {item.food.serving_size} -{' '}
                  {Math.round(item.food.calories * item.servings)} cal
                </div>
              </div>
              <button
                onClick={() => handleRemoveFood(index)}
                className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}

          {/* Totals */}
          <div className="p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total:</span>
              <span className="font-bold">{Math.round(totals.calories)} cal</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>
                P: {Math.round(totals.protein)}g • C: {Math.round(totals.carbs)}g
                • F: {Math.round(totals.fat)}g
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => setShowFoodSearch(true)}
          className="w-full btn btn-secondary"
        >
          + Add Food
        </button>

        {foodItems.length > 0 && (
          <button
            onClick={handleLogMeal}
            disabled={logging}
            className="w-full btn btn-primary"
          >
            {logging ? 'Logging...' : 'Log Meal'}
          </button>
        )}
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
    </div>
  );
};
