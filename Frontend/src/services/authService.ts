import api, { normaliseId } from './api';
import { User, UserRole } from '../types';

const normaliseUser = (raw: any): User => {
  const u = normaliseId(raw);
  return {
    ...u,
    id: u._id || u.id,
    token: u.token,
  };
};

export const authService = {
  login: async (email: string, password: string, role: UserRole): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password, role });
    return normaliseUser(data.user);
  },

  register: async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return normaliseUser(data.user);
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return normaliseUser(data.user);
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout').catch(() => {}); // best-effort
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },
};
