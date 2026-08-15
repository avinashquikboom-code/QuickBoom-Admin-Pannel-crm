import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { token, tenantId } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    toast.error(Array.isArray(message) ? message[0] : message);
    return Promise.reject(error);
  },
);

export default api;
