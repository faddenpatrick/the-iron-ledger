import api from './api';
import {
  Supplement,
  SupplementWithLog,
  SupplementLog,
  CreateSupplementRequest,
  UpdateSupplementRequest,
  LogSupplementRequest,
} from '../types/supplements';

export const getSupplements = async (includeInactive = false): Promise<Supplement[]> => {
  const params: Record<string, string> = {};
  if (includeInactive) params.include_inactive = 'true';
  const response = await api.get('/supplements', { params });
  return response.data;
};

export const getDailySupplements = async (date: string): Promise<SupplementWithLog[]> => {
  const response = await api.get('/supplements/daily', { params: { date } });
  return response.data;
};

export const createSupplement = async (data: CreateSupplementRequest): Promise<Supplement> => {
  const response = await api.post('/supplements', data);
  return response.data;
};

export const updateSupplement = async (id: string, data: UpdateSupplementRequest): Promise<Supplement> => {
  const response = await api.put(`/supplements/${id}`, data);
  return response.data;
};

export const deleteSupplement = async (id: string): Promise<void> => {
  await api.delete(`/supplements/${id}`);
};

export const logSupplement = async (data: LogSupplementRequest): Promise<SupplementLog> => {
  const response = await api.post('/supplements/log', data);
  return response.data;
};

export const unlogSupplement = async (supplementId: string, date: string): Promise<void> => {
  await api.delete(`/supplements/log/${supplementId}/${date}`);
};
