import api from './api';
import { BodyMeasurement, CreateMeasurementRequest } from '../types/measurements';

export const getMeasurements = async (
  startDate?: string,
  endDate?: string
): Promise<BodyMeasurement[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await api.get('/measurements', { params });
  return response.data;
};

export const getLatestMeasurement = async (): Promise<BodyMeasurement | null> => {
  const response = await api.get('/measurements/latest');
  return response.data;
};

export const logMeasurement = async (
  data: CreateMeasurementRequest
): Promise<BodyMeasurement> => {
  const response = await api.post('/measurements', data);
  return response.data;
};

export const deleteMeasurement = async (id: string): Promise<void> => {
  await api.delete(`/measurements/${id}`);
};
