import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.qbapp.online/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { token, customerId } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (customerId) {
        config.headers['x-customer-id'] = customerId;
        config.headers['x-tenant-id'] = customerId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Attempt token refresh on 401 if refreshToken exists and not already retried
    if (error?.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      const { refreshToken, setAuth, logout, user } = useAuthStore.getState();

      if (refreshToken && user) {
        try {
          const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.qbapp.online/api/v1';
          const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const newTokens = refreshRes?.data?.tokens || refreshRes?.data;
          
          if (newTokens?.accessToken) {
            setAuth(user, newTokens.accessToken, newTokens.refreshToken || refreshToken);
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } else if (window.location.pathname !== '/login') {
        logout();
        window.location.href = '/login';
      }
    }

    let message = 'An unexpected error occurred';

    if (error && error.response && error.response.data) {
      const dataMsg = error.response.data.message;
      if (typeof dataMsg === 'string') {
        message = dataMsg;
      } else if (Array.isArray(dataMsg) && dataMsg.length > 0) {
        message = typeof dataMsg[0] === 'string' ? dataMsg[0] : JSON.stringify(dataMsg[0]);
      } else if (typeof dataMsg === 'object') {
        message = JSON.stringify(dataMsg);
      }
    } else if (error && typeof error.message === 'string' && error.message.trim().length > 0) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (typeof message === 'string' && message !== '[object Event]' && message !== '[object Object]') {
      if (error?.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
