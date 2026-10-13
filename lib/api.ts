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

  // Read one complete session; never rank tokens from different sessions by expiry.
  let session: any = activeStore;
  if (!activeStore._hasHydrated) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) session = JSON.parse(raw)?.state || activeStore;
    } catch {}
  }

  // Legacy admin keys are only a fallback before hydration when no session exists.
  if (!isEmployeeRoute && !activeStore._hasHydrated && session === activeStore &&
      !session.token && !session.user) {
    try {
      session = {
        token: localStorage.getItem('accessToken') || localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
        user: JSON.parse(localStorage.getItem('user') || 'null'),
      };
    } catch {}
  }

  const token = isValidTokenString(session.token) ? session.token.trim() : null;
  const refreshToken = isValidTokenString(session.refreshToken) ? session.refreshToken.trim() : null;
  const user = session.user || null;
  const customerId = session.customerId || user?.customerId || null;

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
let refreshSessionKey: string | null = null;

function currentSessionKey(): string {
  const { token, refreshToken, user } = getPersistedAuthSession();
  // Internal comparison only; this key must never be logged.
  return JSON.stringify([isEmployeePortalRoute(), user?.id, token, refreshToken]);
}

/**
 * Executes a single-flight token refresh. Concurrent callers share the exact same promise.
 */
export async function performTokenRefresh(): Promise<string> {
  const sessionKey = currentSessionKey();
  if (refreshPromise && refreshSessionKey === sessionKey) {
    return refreshPromise;
  }

  refreshSessionKey = sessionKey;
  const pendingRefresh = (async () => {
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

      if (currentSessionKey() !== sessionKey) {
        throw new Error('Authentication session changed during refresh');
      }

      // 1. Update in-memory auth store and localStorage
      authStore.updateTokens(newAccessToken, newRefreshToken);

      return newAccessToken;
    } catch (refreshErr: any) {
      const status = refreshErr?.response?.status;
      const isAuthFailure =
        status === 401 ||
        status === 403 ||
        refreshErr?.message === 'No refresh token available' ||
        refreshErr?.message === 'Refresh endpoint did not return an access token';

      if (isAuthFailure && currentSessionKey() === sessionKey) {
        const isEmployeeRoute = isEmployeePortalRoute();
        const authStore = isEmployeeRoute ? useEmployeeAuthStore.getState() : useAuthStore.getState();
        const loginRoute = isEmployeeRoute ? '/employee/login' : '/login';

        authStore.logout();
        if (typeof window !== 'undefined' && window.location.pathname !== loginRoute) {
          toast.error('Your session has expired. Please login again.');
          window.location.href = loginRoute;
        }
      }
      throw refreshErr;
    } finally {
      if (refreshSessionKey === sessionKey) {
        refreshPromise = null;
        refreshSessionKey = null;
      }
    }
  })();

  refreshPromise = pendingRefresh;
  return pendingRefresh;
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

    // Bodyless DELETE/GET must not force application/json. That header triggers
    // an extra CORS preflight and some proxies drop Authorization on DELETE.
    const method = (config.method || 'get').toUpperCase();
    const hasBody =
      config.data !== undefined &&
      config.data !== null &&
      config.data !== '' &&
      !(typeof FormData !== 'undefined' && config.data instanceof FormData);
    if ((method === 'DELETE' || method === 'GET' || method === 'HEAD') && !hasBody) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else if (hasBody) {
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
              // Re-read after refresh failure: logout must not leave a stale bearer attached.
              ({ token, refreshToken, customerId, user } = getPersistedAuthSession());
              (config as any)._refreshAttempted = true;
            }
          }
        } catch (_) {}
      }

      // Remove defaults or caller headers from a previous session first.
      config.headers.delete('Authorization');
      config.headers.delete('x-customer-id');
      config.headers.delete('x-tenant-id');
      if (token && !isAuthUrl) {
        const cleanToken = token.replace(/^["']|["']$/g, '').trim();
        if (typeof config.headers?.set === 'function') {
          config.headers.set('Authorization', `Bearer ${cleanToken}`);
        } else {
          config.headers = config.headers || {};
          delete (config.headers as any)['authorization'];
          config.headers['Authorization'] = `Bearer ${cleanToken}`;
        }
      }

      if (customerId && !isAuthUrl) {
        if (typeof config.headers?.set === 'function') {
          config.headers.set('x-customer-id', String(customerId));
          config.headers.set('x-tenant-id', String(customerId));
        } else {
          config.headers = config.headers || {};
          config.headers['x-customer-id'] = String(customerId);
          config.headers['x-tenant-id'] = String(customerId);
        }
      }

      (config as any).__authUserId = user?.id;
      (config as any).__employeePortal = isEmployeePortalRoute();


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
        redactData(resData)
      );
    }

    if (response.data instanceof Blob) {
      const cd =
        response.headers?.['content-disposition'] ||
        response.headers?.['Content-Disposition'];
      if (cd && typeof cd === 'string') {
        (response.data as any).__contentDisposition = cd;
      }
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

    // An old account's failed request must not refresh or log out the new account.
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const currentUser = getPersistedAuthSession().user;
      if (originalRequest.__authUserId !== currentUser?.id ||
          originalRequest.__employeePortal !== isEmployeePortalRoute()) {
        return Promise.reject(error);
      }
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
      !originalRequest._refreshAttempted &&
      !isAuthUrl &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      try {
        // A late 401 from the old token can reuse the token already refreshed.
        const currentToken = getPersistedAuthSession().token;
        const sentHeader = originalRequest.headers?.get?.('Authorization') ||
          originalRequest.headers?.Authorization;
        const newAccessToken = currentToken && sentHeader !== `Bearer ${currentToken}`
          ? currentToken
          : await performTokenRefresh();

        const retryConfig: AxiosRequestConfig = {
          ...originalRequest,
          method: originalRequest.method,
          url: originalRequest.url,
          params: originalRequest.params,
          data: originalRequest.data,
          headers: originalRequest.headers || {},
        };

        if (typeof retryConfig.headers?.set === 'function') {
          retryConfig.headers.set('Authorization', `Bearer ${newAccessToken}`);
        } else {
          retryConfig.headers = retryConfig.headers || {};
          delete (retryConfig.headers as any)['authorization'];
          retryConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        return api.request(retryConfig);
      } catch {
        return Promise.reject(error);
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
