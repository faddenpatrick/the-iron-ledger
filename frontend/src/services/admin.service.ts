import api from './api';
import type {
  AdminOverview,
  UserGrowthResponse,
  UserListResponse,
  FeatureAdoption,
} from '../types/admin';

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const response = await api.get('/admin/overview');
  return response.data;
};

export const getUserGrowth = async (days: number = 30): Promise<UserGrowthResponse> => {
  const response = await api.get('/admin/user-growth', { params: { days } });
  return response.data;
};

export const getUserList = async (): Promise<UserListResponse> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getFeatureAdoption = async (): Promise<FeatureAdoption> => {
  const response = await api.get('/admin/feature-adoption');
  return response.data;
};
