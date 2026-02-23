import api from './api';
import { CoachInsight } from '../types/coaching';

export const getCoachInsight = async (): Promise<CoachInsight> => {
  const response = await api.get('/coaching/insight');
  return response.data;
};
