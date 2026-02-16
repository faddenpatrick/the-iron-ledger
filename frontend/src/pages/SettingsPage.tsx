import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useSettings } from '../hooks/useSettings';
import { clearAllData } from '../services/indexeddb.service';
import {
  percentageToGrams,
  gramsToPercentage,
  validatePercentageSum,
} from '../utils/macroCalculations';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSettings();

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Form state
  const [units, setUnits] = useState<'lbs' | 'kg'>('lbs');
  const [restTimer, setRestTimer] = useState(90);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  // Macro mode state
  const [macroMode, setMacroMode] = useState<'grams' | 'percentage'>('grams');
  const [proteinPct, setProteinPct] = useState('');
  const [carbsPct, setCarbsPct] = useState('');
  const [fatPct, setFatPct] = useState('');

  // Capture PWA install prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Initialize form from settings
  useEffect(() => {
    if (settings) {
      setUnits(settings.units);
      setRestTimer(settings.default_rest_timer);
      setCalories(settings.macro_target_calories?.toString() || '');
      setProtein(settings.macro_target_protein?.toString() || '');
      setCarbs(settings.macro_target_carbs?.toString() || '');
      setFat(settings.macro_target_fat?.toString() || '');
      setMacroMode(settings.macro_input_mode || 'grams');
      setProteinPct(settings.macro_percentage_protein?.toString() || '');
      setCarbsPct(settings.macro_percentage_carbs?.toString() || '');
      setFatPct(settings.macro_percentage_fat?.toString() || '');
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
      if (macroMode === 'percentage') {
        // Validate percentages
        const proteinVal = parseInt(proteinPct) || 0;
        const carbsVal = parseInt(carbsPct) || 0;
        const fatVal = parseInt(fatPct) || 0;
        const caloriesVal = parseInt(calories) || 0;

        if (!caloriesVal) {
          alert('Calories must be set when using percentage mode');
          setSaving(false);
          return;
        }

        const validation = validatePercentageSum(proteinVal, carbsVal, fatVal);
        if (!validation.isValid) {
          alert(`Macro percentages must total 100% (currently ${validation.total}%)`);
          setSaving(false);
          return;
        }

        await updateSettings({
          macro_input_mode: 'percentage',
          macro_target_calories: caloriesVal,
          macro_percentage_protein: proteinVal,
          macro_percentage_carbs: carbsVal,
          macro_percentage_fat: fatVal,
        });
      } else {
        // Grams mode
        await updateSettings({
          macro_input_mode: 'grams',
          macro_target_calories: calories ? parseInt(calories) : null,
          macro_target_protein: protein ? parseInt(protein) : null,
          macro_target_carbs: carbs ? parseInt(carbs) : null,
          macro_target_fat: fat ? parseInt(fat) : null,
        });
      }
      alert('Macro targets saved!');
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Failed to save macro targets');
    } finally {
      setSaving(false);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Installation prompt not available. Try refreshing the page.');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the prompt as it can only be used once
    setDeferredPrompt(null);
    setIsInstallable(false);
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

        {/* PWA Install */}
        {!isInstalled && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Install App</h3>
            <p className="text-sm text-gray-400 mb-4">
              {isInstallable
                ? 'Install The Iron Ledger as a standalone app on your device for the best experience.'
                : 'The app can be installed once it\'s ready. Try refreshing the page if you don\'t see the install button.'}
            </p>
            {isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="btn btn-primary w-full"
              >
                📱 Install App
              </button>
            ) : (
              <div className="p-3 bg-gray-700 rounded-lg text-sm text-gray-400">
                <p className="mb-2">
                  <strong>Benefits of installing:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Works offline with all your data</li>
                  <li>No browser UI - looks like a native app</li>
                  <li>App shortcuts for quick access</li>
                  <li>Faster loading and better performance</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {isInstalled && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">✓ App Installed</h3>
            <p className="text-sm text-gray-400">
              The Iron Ledger is installed as a standalone app on your device.
            </p>
          </div>
        )}

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
            Set your daily nutrition goals by grams or percentages.
          </p>

          {/* Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Input Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMacroMode('grams')}
                className={`flex-1 py-2 px-4 rounded ${
                  macroMode === 'grams'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Grams
              </button>
              <button
                onClick={() => setMacroMode('percentage')}
                className={`flex-1 py-2 px-4 rounded ${
                  macroMode === 'percentage'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Calories Input (required for percentage mode) */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Calories {macroMode === 'percentage' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 2000"
              className="input w-full"
            />
          </div>

          {macroMode === 'percentage' ? (
            <>
              {/* Percentage Mode */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (%)</label>
                  <input
                    type="number"
                    value={proteinPct}
                    onChange={(e) => setProteinPct(e.target.value)}
                    placeholder="e.g., 40"
                    min="0"
                    max="100"
                    className="input w-full"
                  />
                  {proteinPct && calories && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {percentageToGrams(parseInt(proteinPct), 'protein', parseInt(calories))}g
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (%)</label>
                  <input
                    type="number"
                    value={carbsPct}
                    onChange={(e) => setCarbsPct(e.target.value)}
                    placeholder="e.g., 30"
                    min="0"
                    max="100"
                    className="input w-full"
                  />
                  {carbsPct && calories && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {percentageToGrams(parseInt(carbsPct), 'carbs', parseInt(calories))}g
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fat (%)</label>
                  <input
                    type="number"
                    value={fatPct}
                    onChange={(e) => setFatPct(e.target.value)}
                    placeholder="e.g., 30"
                    min="0"
                    max="100"
                    className="input w-full"
                  />
                  {fatPct && calories && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {percentageToGrams(parseInt(fatPct), 'fat', parseInt(calories))}g
                    </p>
                  )}
                </div>
              </div>

              {/* Percentage Validation */}
              {proteinPct && carbsPct && fatPct && (() => {
                const validation = validatePercentageSum(
                  parseInt(proteinPct) || 0,
                  parseInt(carbsPct) || 0,
                  parseInt(fatPct) || 0
                );
                return (
                  <div className={`mt-3 p-2 rounded text-sm ${
                    validation.isValid
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {validation.isValid ? (
                      <span>✓ Percentages total 100%</span>
                    ) : (
                      <span>⚠ Percentages must total 100% (currently {validation.total}%)</span>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* Grams Mode */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="e.g., 150"
                    className="input w-full"
                  />
                  {protein && calories && parseInt(calories) > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {gramsToPercentage(parseInt(protein), 'protein', parseInt(calories))}%
                    </p>
                  )}
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
                  {carbs && calories && parseInt(calories) > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {gramsToPercentage(parseInt(carbs), 'carbs', parseInt(calories))}%
                    </p>
                  )}
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
                  {fat && calories && parseInt(calories) > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {gramsToPercentage(parseInt(fat), 'fat', parseInt(calories))}%
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

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
