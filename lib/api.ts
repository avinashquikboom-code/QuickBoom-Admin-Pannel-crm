import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './store';
import { useEmployeeAuthStore } from './employee-store';
import { getErrorMessage } from './utils';

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.qbapp.online/api/v1';

const isEmployeePortalRoute = () =>
  typeof window !== 'undefined' &&
  (window.location.pathname === '/employee' ||
    window.location.pathname.startsWith('/employee/'));

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

/**
 * Robust base64url JWT payload decoder that handles URL-safe characters (- and _)
 * and missing padding without throwing InvalidCharacterError in browser environments.
 */
export function safeDecodeJwtPayload(token: string): any {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.trim().replace(/^["']|["']$/g, '').split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonStr =
      typeof window !== 'undefined'
        ? decodeURIComponent(
            Array.prototype.map
              .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Returns prioritized candidates for token refresh endpoints to prevent 404s
 * regardless of whether baseURL has a trailing /api/v1 suffix.
 */
export function getAuthRefreshCandidates(rawBase: string): string[] {
  const clean = (rawBase || '').replace(/\/+$/, '');
  const hasApiV1 = clean.endsWith('/api/v1');
  const baseWithApi = hasApiV1 ? clean : `${clean}/api/v1`;
  const baseWithoutApi = clean.replace(/\/api\/v1$/, '');

  return Array.from(
    new Set([
      `${baseWithApi}/auth/refresh`,
      `${baseWithApi}/admin/auth/refresh`,
      `${baseWithoutApi}/auth/refresh`,
      `${baseWithoutApi}/admin/auth/refresh`,
    ])
  );
}

export function getPersistedAuthSession() {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: null, user: null, customerId: null };
  }
  
  const isEmployeeRoute = isEmployeePortalRoute();
  const activeStore = isEmployeeRoute ? useEmployeeAuthStore.getState() : useAuthStore.getState();
  const storageKey = isEmployeeRoute ? 'qb-employee-auth-storage' : 'quikboom-next-auth-storage';

  let token = isValidTokenString(activeStore.token) ? activeStore.token.trim() : null;
  let refreshToken = isValidTokenString(activeStore.refreshToken) ? activeStore.refreshToken.trim() : null;
  let user = activeStore.user;
  let customerId = (activeStore as any).customerId || user?.customerId;

  if (!token || !refreshToken || !user) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state) {
          if (!token && isValidTokenString(parsed.state.token)) token = parsed.state.token.trim();
          if (!refreshToken && isValidTokenString(parsed.state.refreshToken)) refreshToken = parsed.state.refreshToken.trim();
          user = user || parsed.state.user || null;
          customerId = customerId || parsed.state.customerId || parsed.state.user?.customerId || null;
        }
      }
    } catch {}
  }

  // Login also writes these keys. Use them when the in-memory store is empty,
  // and prefer the token that expires later when both exist.
  const rawAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (isValidTokenString(rawAccessToken)) {
    const storedAccessToken = rawAccessToken.trim();
    if (!token) {
      token = storedAccessToken;
    } else if (token !== storedAccessToken) {
      const memoryExp = Number(safeDecodeJwtPayload(token)?.exp || 0);
      const storedExp = Number(safeDecodeJwtPayload(storedAccessToken)?.exp || 0);
      if (storedExp > memoryExp) token = storedAccessToken;
    }
  }
  if (!refreshToken) {
    const rawRefresh = localStorage.getItem('refreshToken');
    if (isValidTokenString(rawRefresh)) refreshToken = rawRefresh.trim();
  }
  if (!user) {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) user = JSON.parse(userStr);
    } catch {}
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

// Single-flight refresh promise: prevents duplicate concurrent /auth/refresh network calls
let refreshPromise: Promise<string> | null = null;

/**
 * Executes a single-flight token refresh. Concurrent callers share the exact same promise.
 */
export async function performTokenRefresh(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const isEmployeeRoute = isEmployeePortalRoute();
      const authStore = isEmployeeRoute ? useEmployeeAuthStore.getState() : useAuthStore.getState();
      const loginRoute = isEmployeeRoute ? '/employee/login' : '/login';
      const { refreshToken } = getPersistedAuthSession();

      if (!refreshToken) {
        authStore.logout();
        if (typeof window !== 'undefined' && window.location.pathname !== loginRoute) {
          window.location.href = loginRoute;
        }
        throw new Error('No refresh token available');
      }

      const candidates = getAuthRefreshCandidates(api.defaults.baseURL || apiBaseURL);
      let refreshRes: any = null;
      let lastErr: any = null;

      for (const endpoint of candidates) {
        try {
          refreshRes = await axios.post(
            endpoint,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-client-type': 'admin',
              },
            }
          );
          if (refreshRes?.data) {
            lastErr = null;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          // If 404, try next candidate route
          if (err?.response?.status === 404) {
            continue;
          }
          // For 401 or other fatal auth errors, abort candidates immediately
          throw err;
        }
      }

      if (lastErr && !refreshRes?.data) {
        throw lastErr;
      }

      const resData = refreshRes?.data;
      const payload = resData?.data?.tokens || resData?.data || resData?.tokens || resData;
      const newAccessToken = (payload?.accessToken || payload?.token || '').replace(/^["']|["']$/g, '').trim();
      const newRefreshToken = (payload?.refreshToken || refreshToken).replace(/^["']|["']$/g, '').trim();

      if (!newAccessToken) {
        throw new Error('Refresh endpoint did not return an access token');
      }

      // 1. Update in-memory auth store and localStorage
      authStore.updateTokens(newAccessToken, newRefreshToken);

      // 2. Update default Authorization header on api instance
      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      }

      return newAccessToken;
    } catch (refreshErr: any) {
      const isEmployeeRoute = isEmployeePortalRoute();
      const authStore = isEmployeeRoute ? useEmployeeAuthStore.getState() : useAuthStore.getState();
      const loginRoute = isEmployeeRoute ? '/employee/login' : '/login';

      authStore.logout();
      if (typeof window !== 'undefined' && window.location.pathname !== loginRoute) {
        toast.error('Your session has expired. Please login again.');
        window.location.href = loginRoute;
      }
      throw refreshErr;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor: attach bearer token and customer headers + logging
api.interceptors.request.use(
  async (config) => {
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

    // Ensure Content-Type is application/json for requests with payload (especially DELETE)
    if (config.data && !(typeof FormData !== 'undefined' && config.data instanceof FormData)) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Content-Type', 'application/json');
      } else if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    if (typeof window !== 'undefined') {
      let { token, refreshToken, customerId, user } = getPersistedAuthSession();

      const isAuthUrl =
        typeof config.url === 'string' &&
        (config.url.includes('/auth/refresh') ||
          config.url.includes('/auth/login') ||
          config.url.includes('/admin/auth/login') ||
          config.url.includes('/mobile/auth/login') ||
          config.url.includes('/auth/register') ||
          config.url.includes('/login'));

      // Proactive token refresh if token is expired or expiring in <= 15 seconds (and request is not a retry)
      if (!isAuthUrl && !(config as any)._retry && token && refreshToken) {
        try {
          const payload = safeDecodeJwtPayload(token);
          if (payload?.exp && payload.exp * 1000 <= Date.now() + 15000) {
            try {
              token = await performTokenRefresh();
            } catch (_) {
              // If proactive refresh fails, allow request to proceed and let 401 response interceptor handle it
            }
          }
        } catch (_) {}
      }

      if (token) {
        const cleanToken = token.replace(/^["']|["']$/g, '').trim();
        if (typeof config.headers?.set === 'function') {
          config.headers.set('Authorization', `Bearer ${cleanToken}`);
        } else {
          config.headers = config.headers || {};
          delete (config.headers as any)['authorization'];
          config.headers['Authorization'] = `Bearer ${cleanToken}`;
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


      let tokenExpired = false;
      let jwtUserId: any = null;
      let jwtEmployeeId: any = null;
      let jwtCompanyId: any = null;
      if (token) {
        const payload = safeDecodeJwtPayload(token);
        if (payload) {
          if (payload.exp) {
            tokenExpired = payload.exp * 1000 <= Date.now();
          }
          jwtUserId = payload.sub || payload.id || payload.userId || null;
          jwtEmployeeId = payload.employeeId || null;
          jwtCompanyId = payload.customerId || payload.companyId || payload.tenantId || null;
        }
      }

      const isMetaTestSend = typeof config.url === 'string' && config.url.includes('/templates/meta/test-send');
      if (isMetaTestSend || process.env.NODE_ENV !== 'production') {
        console.log(
          `[AUTH DEBUG]\n` +
          `endpoint: ${config.url}\n` +
          `authorizationHeaderPresent: ${Boolean(token)}\n` +
          `tokenType: ${token ? 'Bearer' : 'none'}\n` +
          `tokenExpired: ${tokenExpired}\n` +
          `userId: ${jwtUserId || user?.id || 'none'}`
        );

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

    // 1. Prevent infinite loops: If originalRequest was ALREADY retried and gets 401 again
    if (
      error?.response?.status === 401 &&
      originalRequest._retry &&
      !isAuthUrl &&
      typeof window !== 'undefined'
    ) {
      const isEmployeeRoute = isEmployeePortalRoute();
      const authStore = isEmployeeRoute ? useEmployeeAuthStore.getState() : useAuthStore.getState();
      const loginRoute = isEmployeeRoute ? '/employee/login' : '/login';
      authStore.logout();
      if (window.location.pathname !== loginRoute) {
        toast.error('Your session has expired. Please login again.');
        window.location.href = loginRoute;
      }
      return Promise.reject(error);
    }

    // 2. Handle 401 on first attempt: Refresh token once and retry original request
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthUrl &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await performTokenRefresh();

        // Update Authorization header on the retried request
        if (typeof originalRequest.headers?.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          delete (originalRequest.headers as any)['authorization'];
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        // Retry original request
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
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
