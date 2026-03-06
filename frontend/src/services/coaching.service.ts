import api from './api';
import { CoachInsight, DailyCoaching } from '../types/coaching';

export const getCoachInsight = async (): Promise<CoachInsight> => {
  const response = await api.get('/coaching/insight');
  return response.data;
};

export const getDailyCoaching = async (): Promise<DailyCoaching> => {
  const response = await api.get('/coaching/daily-coaching');
  return response.data;
};
