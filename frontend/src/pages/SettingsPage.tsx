import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useSettings } from '../hooks/useSettings';
import { clearAllData } from '../services/indexeddb.service';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSettings();

  // Form state
  const [units, setUnits] = useState<'lbs' | 'kg'>('lbs');
  const [restTimer, setRestTimer] = useState(90);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form from settings
  useEffect(() => {
    if (settings) {
      setUnits(settings.units);
      setRestTimer(settings.default_rest_timer);
      setCalories(settings.macro_target_calories?.toString() || '');
      setProtein(settings.macro_target_protein?.toString() || '');
      setCarbs(settings.macro_target_carbs?.toString() || '');
      setFat(settings.macro_target_fat?.toString() || '');
    }
  }, [settings]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updateSettings({
        units,
        default_rest_timer: restTimer,
      });
      alert('Preferences saved!');
    } catch (error) {
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMacros = async () => {
    setSaving(true);
    try {
      await updateSettings({
        macro_target_calories: calories ? parseInt(calories) : null,
        macro_target_protein: protein ? parseInt(protein) : null,
        macro_target_carbs: carbs ? parseInt(carbs) : null,
        macro_target_fat: fat ? parseInt(fat) : null,
      });
      alert('Macro targets saved!');
    } catch (error) {
      alert('Failed to save macro targets');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout? This will clear all offline data.')) {
      await clearAllData();
      logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Settings" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="card text-center py-8">
            <div className="text-gray-400">Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Settings" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Account */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="btn btn-secondary w-full"
          >
            Logout
          </button>
        </div>

        {/* Preferences */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Preferences</h3>

          {/* Units */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Weight Units</label>
            <div className="flex gap-2">
              <button
                onClick={() => setUnits('lbs')}
                className={`flex-1 py-2 px-4 rounded ${
                  units === 'lbs'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                onClick={() => setUnits('kg')}
                className={`flex-1 py-2 px-4 rounded ${
                  units === 'kg'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Rest Timer */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Default Rest Timer (seconds)
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRestTimer(Math.max(0, restTimer - 15))}
                className="btn btn-secondary w-12"
              >
                -
              </button>
              <input
                type="number"
                value={restTimer}
                onChange={(e) => setRestTimer(parseInt(e.target.value) || 0)}
                className="flex-1 input text-center"
                min="0"
                max="600"
              />
              <button
                onClick={() => setRestTimer(Math.min(600, restTimer + 15))}
                className="btn btn-secondary w-12"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="btn btn-primary w-full"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Macro Targets */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Daily Macro Targets</h3>
          <p className="text-sm text-gray-400 mb-4">
            Set your daily nutrition goals. Leave blank to not track a specific macro.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g., 2000"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="e.g., 150"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="e.g., 200"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="e.g., 60"
                className="input w-full"
              />
            </div>
          </div>

          <button
            onClick={handleSaveMacros}
            disabled={saving}
            className="btn btn-primary w-full mt-4"
          >
            {saving ? 'Saving...' : 'Save Macro Targets'}
          </button>
        </div>

        {/* App Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <p className="text-sm text-gray-400">
            HealthApp v1.0.0<br />
            Offline-first workout & nutrition tracker
          </p>
        </div>
      </div>
    </div>
  );
};
