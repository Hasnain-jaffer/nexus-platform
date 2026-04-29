/**
 * Centralised Axios instance.
 * All service files import from here — never create axios instances elsewhere.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT automatically ─────────────────────────
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('business_nexus_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config;
});

// ── Response interceptor: handle 401 globally ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('business_nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * normaliseId — MongoDB returns `_id`. The frontend uses `id`.
 * Call this on any raw API object before putting it in state.
 */
export const normaliseId = <T extends { _id?: string; id?: string }>(obj: T): T & { id: string } => {
  return { ...obj, id: obj._id || obj.id || '' };
};

export const normaliseList = <T extends { _id?: string; id?: string }>(list: T[]): (T & { id: string })[] => {
  return list.map(normaliseId);
};

export default api;
