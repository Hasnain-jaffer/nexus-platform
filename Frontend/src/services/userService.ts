import api, { normaliseId, normaliseList } from './api';
import { User, Entrepreneur, Investor } from '../types';

export const userService = {
  /** GET /api/users/entrepreneurs?search=&industry= */
  getEntrepreneurs: async (params?: { search?: string; industry?: string }): Promise<Entrepreneur[]> => {
    const { data } = await api.get('/users/entrepreneurs', { params });
    return normaliseList(data.entrepreneurs) as Entrepreneur[];
  },

  /** GET /api/users/investors?search=&interest=&stage= */
  getInvestors: async (params?: { search?: string; interest?: string; stage?: string }): Promise<Investor[]> => {
    const { data } = await api.get('/users/investors', { params });
    return normaliseList(data.investors) as Investor[];
  },

  /** GET /api/users/:id */
  getUserById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return normaliseId(data.user) as User;
  },

  /** PUT /api/users/:id */
  updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, updates);
    return normaliseId(data.user) as User;
  },
};
