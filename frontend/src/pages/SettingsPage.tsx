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
import { COACH_OPTIONS } from '../types/coaching';
import { BodyMeasurement } from '../types/measurements';
import { getMeasurements, logMeasurement } from '../services/measurements.service';
import { format, parseISO } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSettings();

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    displayMode: string;
    serviceWorkerRegistered: boolean;
    isStandalone: boolean;
    eventListenerRegistered: boolean;
    manifestLoaded: boolean;
    isSecureContext: boolean;
    protocol: string;
  }>({
    displayMode: 'unknown',
    serviceWorkerRegistered: false,
    isStandalone: false,
    eventListenerRegistered: false,
    manifestLoaded: false,
    isSecureContext: false,
    protocol: 'unknown',
  });

  // Form state
  const [units, setUnits] = useState<'lbs' | 'kg'>('lbs');
  const [restTimer, setRestTimer] = useState(90);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  // Coach state
  const [coachType, setCoachType] = useState('arnold');

  // Macro mode state
  const [macroMode, setMacroMode] = useState<'grams' | 'percentage'>('grams');
  const [proteinPct, setProteinPct] = useState('');
  const [carbsPct, setCarbsPct] = useState('');
  const [fatPct, setFatPct] = useState('');

  // Body weight state
  const [weightInput, setWeightInput] = useState('');
  const [recentMeasurements, setRecentMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightLoading, setWeightLoading] = useState(true);
  const [weightSaving, setWeightSaving] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    console.log('🔧 PWA Debug: useEffect initialized');

    // Check secure context (HTTPS requirement)
    const isSecureContext = window.isSecureContext;
    const protocol = window.location.protocol;
    console.log('🔧 PWA Debug: Secure context:', isSecureContext);
    console.log('🔧 PWA Debug: Protocol:', protocol);

    // Check display mode
    const displayMode = window.matchMedia('(display-mode: standalone)').matches
      ? 'standalone'
      : window.matchMedia('(display-mode: fullscreen)').matches
      ? 'fullscreen'
      : window.matchMedia('(display-mode: minimal-ui)').matches
      ? 'minimal-ui'
      : 'browser';

    console.log('🔧 PWA Debug: Display mode:', displayMode);

    const isStandalone = displayMode === 'standalone' || displayMode === 'fullscreen';

    // Check if already installed
    if (isStandalone) {
      console.log('✅ PWA Debug: App is already installed (standalone mode)');
      setIsInstalled(true);
      setDebugInfo(prev => ({ ...prev, displayMode, isStandalone: true }));
      return;
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        const swRegistered = !!registration;
        console.log('🔧 PWA Debug: Service worker registered:', swRegistered);
        setDebugInfo(prev => ({ ...prev, serviceWorkerRegistered: swRegistered }));
      });
    }

    // Check if manifest is loaded
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const manifestLoaded = !!manifestLink;
    console.log('🔧 PWA Debug: Manifest link found:', manifestLoaded, manifestLink?.getAttribute('href'));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🎉 PWA Debug: beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('✅ PWA Debug: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    console.log('🔧 PWA Debug: Registering event listeners');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    setDebugInfo(prev => ({
      ...prev,
      displayMode,
      isStandalone,
      eventListenerRegistered: true,
      manifestLoaded,
      isSecureContext,
      protocol,
    }));

    // Check if beforeinstallprompt was already fired (unlikely but possible)
    setTimeout(() => {
      console.log('🔧 PWA Debug: 2 seconds elapsed, checking state');
      console.log('  - isInstallable:', isInstallable);
      console.log('  - deferredPrompt:', deferredPrompt);
      console.log('  - User agent:', navigator.userAgent);
    }, 2000);

    return () => {
      console.log('🔧 PWA Debug: Removing event listeners');
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
      setCoachType(settings.coach_type || 'arnold');
      setMacroMode(settings.macro_input_mode || 'grams');
      setProteinPct(settings.macro_percentage_protein?.toString() || '');
      setCarbsPct(settings.macro_percentage_carbs?.toString() || '');
      setFatPct(settings.macro_percentage_fat?.toString() || '');
    }
  }, [settings]);

  // Fetch body measurements
  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setWeightLoading(true);
        const data = await getMeasurements();
        setRecentMeasurements(data);

        // Check if today is already logged and pre-fill
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayEntry = data.find((m) => m.measurement_date === today);
        if (todayEntry && todayEntry.weight !== null) {
          setWeightInput(todayEntry.weight.toString());
          setTodayLogged(true);
        }
      } catch (error) {
        console.error('Failed to fetch measurements:', error);
      } finally {
        setWeightLoading(false);
      }
    };
    fetchMeasurements();
  }, []);

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setWeightSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await logMeasurement({
        measurement_date: today,
        weight: parseFloat(weightInput),
      });
      setTodayLogged(true);

      // Refresh measurements list
      const data = await getMeasurements();
      setRecentMeasurements(data);
    } catch (error) {
      alert('Failed to log weight');
    } finally {
      setWeightSaving(false);
    }
  };

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
          <>
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

            {/* PWA Debug Info */}
            <div className="card border border-yellow-700/30">
              <h3 className="text-sm font-semibold mb-2 text-yellow-400">🔧 PWA Debug Info</h3>
              <div className="text-xs space-y-1 text-gray-300 font-mono">
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className={debugInfo.protocol === 'https:' ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.protocol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Secure Context:</span>
                  <span className={debugInfo.isSecureContext ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.isSecureContext ? '✓ Yes (HTTPS)' : '✗ No (HTTP)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Display Mode:</span>
                  <span className={debugInfo.displayMode === 'browser' ? 'text-yellow-400' : 'text-green-400'}>
                    {debugInfo.displayMode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Is Standalone:</span>
                  <span className={debugInfo.isStandalone ? 'text-green-400' : 'text-gray-400'}>
                    {debugInfo.isStandalone ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Service Worker:</span>
                  <span className={debugInfo.serviceWorkerRegistered ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.serviceWorkerRegistered ? '✓ Registered' : '✗ Not registered'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Manifest:</span>
                  <span className={debugInfo.manifestLoaded ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.manifestLoaded ? '✓ Found' : '✗ Not found'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Event Listener:</span>
                  <span className={debugInfo.eventListenerRegistered ? 'text-green-400' : 'text-red-400'}>
                    {debugInfo.eventListenerRegistered ? '✓ Registered' : '✗ Not registered'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Install Prompt:</span>
                  <span className={isInstallable ? 'text-green-400' : 'text-yellow-400'}>
                    {isInstallable ? '✓ Available' : '⏳ Waiting...'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">
                  <strong>Issue Found:</strong>
                </p>
                <ul className="text-xs text-gray-400 space-y-1">
                  {!debugInfo.isSecureContext && (
                    <>
                      <li className="text-red-400 font-semibold">⚠ HTTPS Required!</li>
                      <li>• Service workers require HTTPS (or localhost)</li>
                      <li>• You're currently using HTTP ({debugInfo.protocol})</li>
                      <li className="mt-2 text-white"><strong>Solution:</strong></li>
                      <li>• Set up HTTPS with a self-signed certificate, or</li>
                      <li>• Access via SSH tunnel: ssh -L 8080:localhost:80 patrick@192.168.1.44</li>
                      <li>• Then open: http://localhost:8080</li>
                    </>
                  )}
                  {debugInfo.isSecureContext && !debugInfo.serviceWorkerRegistered && (
                    <li>• Service worker not registered - check console for errors</li>
                  )}
                  {debugInfo.isSecureContext && !debugInfo.manifestLoaded && (
                    <li>• Manifest not found - check if manifest.webmanifest exists</li>
                  )}
                  {debugInfo.isSecureContext && debugInfo.serviceWorkerRegistered && debugInfo.manifestLoaded && !isInstallable && (
                    <>
                      <li>• PWA criteria met but install prompt not firing</li>
                      <li>• This may be due to browser engagement heuristics</li>
                      <li>• Check browser console for more details (F12)</li>
                      <li>• Try Chrome menu → Install app (top right ⋮)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </>
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

        {/* AI Coach */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">AI Coach</h3>
          <p className="text-sm text-gray-400 mb-4">
            Choose your coaching style. Your coach gives you daily insights on the dashboard based on your workout and nutrition data.
          </p>

          <div className="space-y-2">
            {COACH_OPTIONS.map((coach) => (
              <button
                key={coach.key}
                onClick={() => setCoachType(coach.key)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  coachType === coach.key
                    ? 'border-primary-500 bg-primary-600/15'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{coach.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          coachType === coach.key ? 'text-primary-300' : 'text-gray-200'
                        }`}>
                          {coach.name}
                        </span>
                        <span className="text-xs text-gray-500">{coach.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{coach.philosophy}</p>
                    </div>
                  </div>
                  {coachType === coach.key && (
                    <svg className="w-5 h-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              setSaving(true);
              try {
                await updateSettings({ coach_type: coachType });
                alert('Coach preference saved!');
              } catch {
                alert('Failed to save coach preference');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="btn btn-primary w-full mt-4"
          >
            {saving ? 'Saving...' : 'Save Coach Preference'}
          </button>
        </div>

        {/* Body Weight */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Body Weight</h3>
          <p className="text-sm text-gray-400 mb-4">
            Track your weight over time. Your coach uses this data to give better insights.
          </p>

          {/* Weight input */}
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {todayLogged ? "Today's Weight" : 'Log Today'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="e.g., 185"
                  className="input flex-1"
                />
                <span className="text-sm text-gray-400">{units}</span>
              </div>
            </div>
            <button
              onClick={handleLogWeight}
              disabled={weightSaving || !weightInput}
              className="btn btn-primary px-4 py-2"
            >
              {weightSaving ? '...' : todayLogged ? 'Update' : 'Log'}
            </button>
          </div>

          {/* Recent measurements */}
          {weightLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : recentMeasurements.length > 0 ? (
            <>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent</div>
              <div className="space-y-1.5">
                {recentMeasurements.slice(0, 7).map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      {format(parseISO(m.measurement_date), 'MMM d')}
                    </span>
                    <span className="text-gray-200 font-medium">
                      {m.weight !== null ? `${m.weight} ${units}` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* 30-day trend */}
              {(() => {
                const withWeight = recentMeasurements.filter((m) => m.weight !== null);
                if (withWeight.length >= 2) {
                  const newest = withWeight[0].weight!;
                  const oldest = withWeight[withWeight.length - 1].weight!;
                  const change = newest - oldest;
                  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
                  const color = change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-gray-400';
                  return (
                    <div className={`mt-3 pt-3 border-t border-gray-700 text-sm ${color}`}>
                      {arrow} {change > 0 ? '+' : ''}{change.toFixed(1)} {units} over last {withWeight.length} entries
                    </div>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            <p className="text-sm text-gray-500">No weight entries yet. Log your first weight above!</p>
          )}
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
            The Iron Ledger v1.0.0<br />
            Offline-first workout & nutrition tracker
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Build: {import.meta.env.MODE} • {((window as any).__BUILD_TIME__ || new Date().toISOString()).split('T')[0]}
          </p>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(reg => {
                  if (reg) {
                    reg.update();
                    alert('Checking for updates...');
                  }
                });
              }
            }}
            className="btn btn-secondary w-full mt-3 text-sm"
          >
            Check for Updates
          </button>
        </div>
      </div>
    </div>
  );
};
