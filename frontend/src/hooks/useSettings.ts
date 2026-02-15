import { useState, useEffect } from 'react';
import { UserSettings, UpdateUserSettingsRequest } from '../types/settings';
import { getUserSettings, updateUserSettings } from '../services/settings.service';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getUserSettings();
      setSettings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: UpdateUserSettingsRequest) => {
    try {
      const updated = await updateUserSettings(data);
      setSettings(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
};
