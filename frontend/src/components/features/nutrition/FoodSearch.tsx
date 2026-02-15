import React, { useState, useEffect } from 'react';
import { Food } from '../../../types/nutrition';
import { getFoods, createFood } from '../../../services/nutrition.service';
import { BarcodeScanner } from './BarcodeScanner';
import api from '../../../services/api';

interface FoodSearchProps {
  onSelect: (food: Food) => void;
  onClose: () => void;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect, onClose }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [searchSource, setSearchSource] = useState<'local' | 'openfoodfacts'>('local');
  const [customFood, setCustomFood] = useState({
    name: '',
    serving_size: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  useEffect(() => {
    loadFoods();
  }, [search, searchSource]);

  const loadFoods = async () => {
    setLoading(true);
    try {
      if (searchSource === 'local') {
        // Search local database
        const data = await getFoods(search || undefined);
        setFoods(data);
      } else {
        // Search Open Food Facts
        if (search.length >= 3) {
          const response = await api.get('/openfoodfacts/search', {
            params: { q: search, page_size: 50 }
          });
          // Convert Open Food Facts format to our Food format
          const offFoods = response.data.products.map((p: any) => ({
            id: p.barcode,
            name: p.name,
            serving_size: p.serving_size || '100g',
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
            is_custom: false,
            user_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _source: 'openfoodfacts',
            _barcode: p.barcode,
          }));
          setFoods(offFoods);
        } else {
          setFoods([]);
        }
      }
    } catch (error) {
      console.error('Failed to load foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setLoading(true);

    try {
      const response = await api.get(`/openfoodfacts/barcode/${barcode}`);
      const product = response.data;

      // Create a Food object from the barcode result
      const food: any = {
        id: product.barcode,
        name: product.name,
        serving_size: product.serving_size || '100g',
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        is_custom: false,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _source: 'openfoodfacts',
        _barcode: product.barcode,
      };

      // Directly select the scanned food
      onSelect(food);
      onClose();
    } catch (error: any) {
      console.error('Failed to lookup barcode:', error);
      alert(error?.response?.data?.detail || 'Product not found in database. Try searching manually or create a custom food.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomFood = async () => {
    // Validate all required fields
    if (!customFood.name.trim()) {
      alert('Please enter a food name');
      return;
    }
    if (!customFood.serving_size.trim()) {
      alert('Please enter a serving size');
      return;
    }

    try {
      const newFood = await createFood({
        name: customFood.name.trim(),
        serving_size: customFood.serving_size.trim(),
        calories: parseInt(customFood.calories) || 0,
        protein: parseInt(customFood.protein) || 0,
        carbs: parseInt(customFood.carbs) || 0,
        fat: parseInt(customFood.fat) || 0,
      });
      onSelect(newFood);
      onClose();
    } catch (error: any) {
      console.error('Failed to create food:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to create custom food';
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-gray-800 rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Select Food</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search Source Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setSearchSource('local'); setSearch(''); }}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                searchSource === 'local'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              My Foods
            </button>
            <button
              onClick={() => { setSearchSource('openfoodfacts'); setSearch(''); }}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                searchSource === 'openfoodfacts'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              🌍 Open Food Facts
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchSource === 'local' ? 'Search my foods...' : 'Search Open Food Facts...'}
            className="input"
            autoFocus
          />

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="flex-1 btn btn-secondary text-sm"
            >
              📷 Scan Barcode
            </button>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="flex-1 btn btn-secondary text-sm"
            >
              {showCustomForm ? '← Back' : '+ Custom'}
            </button>
          </div>
        </div>

        {/* Food List or Custom Food Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {showCustomForm ? (
            /* Custom Food Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Food Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  placeholder="e.g., Homemade Protein Shake"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Serving Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customFood.serving_size}
                  onChange={(e) => setCustomFood({ ...customFood, serving_size: e.target.value })}
                  placeholder="e.g., 1 cup, 250g"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={customFood.protein}
                    onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={customFood.carbs}
                    onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={customFood.fat}
                    onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                    placeholder="0"
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateCustomFood}
                className="btn btn-primary w-full"
              >
                Add & Use This Food
              </button>

              <p className="text-xs text-gray-400 text-center">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
          ) : (
            /* Search Results */
            loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : foods.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No foods found</p>
                <p className="text-sm mt-2">Try creating a custom food instead</p>
              </div>
            ) : (
              foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => {
                    onSelect(food);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="font-medium mb-1">{food.name}</div>
                  <div className="text-sm text-gray-400">
                    {food.serving_size} - {food.calories} cal
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};
