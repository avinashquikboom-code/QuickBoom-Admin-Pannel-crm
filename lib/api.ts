import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';
import { getErrorMessage } from './utils';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.qbapp.online/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token and customer headers with localStorage fallback
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let { token, customerId } = useAuthStore.getState();

      // Fast fallback to persisted storage in case Zustand hydration is still settling
      if (!token) {
        try {
          const raw = localStorage.getItem('quikboom-next-auth-storage');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.state?.token) {
              token = parsed.state.token;
            }
            if (parsed?.state?.customerId) {
              customerId = parsed.state.customerId;
            }
          }
        } catch {
          // ignore parsing errors
        }
      }

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

// Concurrency-safe refresh queue state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle data unwrapping, 401 token refresh & error notifications
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Attempt token refresh ONLY on 401 (Authentication/Expiration) — NEVER on 403 (Forbidden)
    if (error?.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      const { refreshToken, setAuth, logout, user } = useAuthStore.getState();

      // If already on login page or no refresh token/user, clear session and exit
      if (!refreshToken || !user) {
        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If refresh is currently in flight, queue this request until refresh completes
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.qbapp.online/api/v1';
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        
        // Normalize response payload across raw and TransformInterceptor wrappers
        const resData = refreshRes?.data;
        const payload = resData?.data || resData?.tokens || resData;
        const newAccessToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken || refreshToken;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        // Update auth store with new tokens
        setAuth(user, newAccessToken, newRefreshToken);
        
        // Notify and drain all queued requests
        processQueue(null, newAccessToken);

        // Retry original request with newly issued token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        logout();
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message = getErrorMessage(error);

    if (typeof message === 'string' && message !== '[object Event]' && message !== '[object Object]') {
      if (error?.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
