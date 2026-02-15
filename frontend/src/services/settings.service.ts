import api from './api';
import { UserSettings, UpdateUserSettingsRequest } from '../types/settings';

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api.get('/user/settings');
  return response.data;
};

export const updateUserSettings = async (
  data: UpdateUserSettingsRequest
): Promise<UserSettings> => {
  const response = await api.put('/user/settings', data);
  return response.data;
};
