import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';
import { getErrorMessage } from './utils';

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.qbapp.online/api/v1';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': 'admin',
  },
});

/**
 * Helper to safely extract token, refreshToken, user, and customerId from Zustand memory
 * with robust fallback to persisted localStorage to guarantee consistency during Next.js hydration or tab switching.
 */
const isValidTokenString = (val: any): val is string =>
  typeof val === 'string' &&
  val.trim().length > 0 &&
  val !== 'null' &&
  val !== 'undefined' &&
  val !== '[object Object]';

export function getPersistedAuthSession() {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: null, user: null, customerId: null };
  }

  const state = useAuthStore.getState();
  let token = isValidTokenString(state.token) ? state.token.trim() : null;
  let refreshToken = isValidTokenString(state.refreshToken) ? state.refreshToken.trim() : null;
  let user = state.user;
  let customerId = state.customerId;

  if (!token || !refreshToken || !user) {
    try {
      const raw = localStorage.getItem('quikboom-next-auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state) {
          if (!token && isValidTokenString(parsed.state.token)) {
            token = parsed.state.token.trim();
          }
          if (!refreshToken && isValidTokenString(parsed.state.refreshToken)) {
            refreshToken = parsed.state.refreshToken.trim();
          }
          user = user || parsed.state.user || null;
          customerId = customerId || parsed.state.customerId || null;
        }
      }
    } catch {
      // ignore storage parsing error
    }
  }

  // Fallback to direct localStorage keys if Zustand store hasn't been populated
  if (!token) {
    const rawAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (isValidTokenString(rawAccessToken)) {
      token = rawAccessToken.trim();
    }
  }
  if (!refreshToken) {
    const rawRefresh = localStorage.getItem('refreshToken');
    if (isValidTokenString(rawRefresh)) {
      refreshToken = rawRefresh.trim();
    }
  }
  if (!user) {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) user = JSON.parse(userStr);
    } catch {
      // ignore user parse error
    }
  }
  if (!customerId && user) {
    customerId = user.customerId || null;
  }

  return { token, refreshToken, user, customerId };
}

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'otp',
  'secret',
  'authorization',
  'apikey',
  'paymentsecret',
];

function redactData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactData);

  const copy: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      copy[key] = '***REDACTED***';
    } else if (typeof value === 'object') {
      copy[key] = redactData(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

// Request interceptor: attach bearer token and customer headers + logging
api.interceptors.request.use(
  (config) => {
    (config as any).__startTime = Date.now();

    // If payload is FormData, strip explicit application/json header so browser sets multipart boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    if (typeof window !== 'undefined') {
      const { token, customerId } = getPersistedAuthSession();

      if (token) {
        if (typeof config.headers?.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers = config.headers || {};
          delete (config.headers as any)['authorization'];
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }

      if (customerId) {
        if (typeof config.headers?.set === 'function') {
          config.headers.set('x-customer-id', String(customerId));
          config.headers.set('x-tenant-id', String(customerId));
        } else {
          config.headers = config.headers || {};
          config.headers['x-customer-id'] = String(customerId);
          config.headers['x-tenant-id'] = String(customerId);
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_DEBUG]', {
          endpoint: config.url,
          hasToken: Boolean(token),
          tokenPrefix: token ? token.substring(0, 15) : null,
        });

        console.debug(
          `[ADMIN_API_REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
          config.params ? { params: config.params } : '',
          config.data ? { payload: redactData(config.data) } : ''
        );
      }
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ADMIN_API_REQUEST_ERROR]', error);
    }
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
    const startTime = (response.config as any)?.__startTime;
    const duration = startTime ? Date.now() - startTime : 0;

    if (process.env.NODE_ENV !== 'production') {
      let recordsCount: number | undefined;
      const resData = response.data;
      if (Array.isArray(resData)) {
        recordsCount = resData.length;
      } else if (resData && typeof resData === 'object' && Array.isArray(resData.data)) {
        recordsCount = resData.data.length;
      }

      console.debug(
        `[ADMIN_API_RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status} (${duration}ms)`,
        recordsCount !== undefined ? `Records: ${recordsCount}` : '',
        resData
      );
    }

    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const startTime = (originalRequest as any)?.__startTime;
    const duration = startTime ? Date.now() - startTime : 0;

    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[ADMIN_ERROR] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${error.response?.status || 'NETWORK_ERROR'} (${duration}ms)`,
        error.response?.data || error.message
      );
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip token refresh if the failed endpoint was the refresh endpoint itself or any login endpoint
    const isAuthUrl =
      typeof originalRequest.url === 'string' &&
      (originalRequest.url.includes('/auth/refresh') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/admin/auth/login') ||
        originalRequest.url.includes('/mobile/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/login'));

    // Attempt token refresh ONLY on 401 (Authentication/Expiration) — NEVER on 403 (Forbidden)
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthUrl &&
      typeof window !== 'undefined'
    ) {
      const { refreshToken } = getPersistedAuthSession();
      const authStore = useAuthStore.getState();

      // If no refresh token exists anywhere in state or storage, session is invalid
      if (!refreshToken) {
        authStore.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If refresh is currently in flight, queue this request until single-flight refresh completes
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            if (typeof originalRequest.headers?.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else {
              originalRequest.headers = originalRequest.headers || {};
              delete (originalRequest.headers as any)['authorization'];
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL =
          api.defaults.baseURL ||
          apiBaseURL;

        // Isolated POST call to avoid interceptor loop
        const refreshRes = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-client-type': 'admin',
            },
          }
        );

        // Normalize response payload across raw and TransformInterceptor wrappers
        const resData = refreshRes?.data;
        const payload = resData?.data || resData?.tokens || resData;
        const newAccessToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken || refreshToken;

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        // Update auth store with new tokens while preserving active session state
        authStore.updateTokens(newAccessToken, newRefreshToken);

        // Notify and drain all queued requests
        processQueue(null, newAccessToken);

        // Retry original request with newly issued token
        if (typeof originalRequest.headers?.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          delete (originalRequest.headers as any)['authorization'];
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStore.logout();
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please login again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const status = error?.response?.status;
    const message = getErrorMessage(error);

    const isNoSubscriptionOrEmpty =
      typeof message === 'string' &&
      (message.toLowerCase().includes('no subscription') ||
        message.toLowerCase().includes('no active sub') ||
        message.toLowerCase().includes('subscription not found'));

    if (
      typeof message === 'string' &&
      message !== '[object Event]' &&
      message !== '[object Object]' &&
      status !== 401 &&
      status !== 404 &&
      !isNoSubscriptionOrEmpty
    ) {
      toast.error(message, { id: message });
    }

    return Promise.reject(error);
  }
);

export default api;
