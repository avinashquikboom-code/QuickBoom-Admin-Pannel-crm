import { persistSession, broadcastAuthMessage } from './admin-session';
import { AUTH_EVENTS, logAuthEvent } from './auth-logger';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm({ email, password }) {
  const errors = {};
  const trimmedEmail = email?.trim() ?? '';
  if (!trimmedEmail) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

export function loginFailureNotice(status, data) {
  const rawMessage = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
  const safe = typeof rawMessage === 'string' && rawMessage.length <= 180 && !/stack|exception|token|passwordhash/i.test(rawMessage)
    ? rawMessage.trim()
    : '';
  const lower = safe.toLowerCase();
  if (status === 401 && /inactive|deactivat|suspended/.test(lower)) {
    return { level: 'warning', message: 'Your account is inactive. Please contact the administrator.' };
  }
  if (status === 401) {
    return { level: 'error', message: 'Invalid email or password.' };
  }
  if (status === 403) {
    return { level: 'error', message: 'You are not authorized to access the Admin Panel.' };
  }
  if (/inactive|deactivat|suspended/.test(lower)) {
    return { level: 'warning', message: 'Your account is inactive. Please contact the administrator.' };
  }
  if (status === 429) {
    return { level: 'warning', message: safe || 'Too many attempts. Please wait and try again.' };
  }
  if (status === 400 || status === 422) {
    return { level: 'error', message: safe || 'Please enter your email and password.' };
  }
  if (!status || status === 408 || status === 504) {
    return { level: 'error', message: 'Unable to connect to the server. Please check your internet connection.' };
  }
  if (status >= 500) {
    return { level: 'error', message: 'Something went wrong. Please try again later.' };
  }
  return { level: 'error', message: safe || 'Something went wrong. Please try again later.' };
}

/**
 * @param {{ email: string, password: string, remember: boolean }} payload
 */
export async function loginAdmin(payload) {
  let response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
  } catch {
    const failure = loginFailureNotice(0, {});
    const error = new Error(failure.message);
    error.level = failure.level;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const failure = loginFailureNotice(response.status, data);
    logAuthEvent(AUTH_EVENTS.LOGIN_FAILED, {
      endpoint: '/api/auth/login',
      httpStatus: response.status,
      errorCode: data?.code || 'LOGIN_FAILED',
      reason: failure.message,
    });
    const error = new Error(failure.message);
    error.level = failure.level;
    throw error;
  }

  if (!data?.token) {
    throw new Error('Sign in did not return a session. Please try again.');
  }

  const user = normalizeAdminUser(data.user, payload.email);
  persistSession({
    token: data.token,
    refreshToken: data.refreshToken || null,
    user,
    remember: Boolean(payload.remember),
    sessionPolicy: data.sessionPolicy || null,
    accessTokenExpiresAt: data.accessTokenExpiresAt || null,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt || null,
  });
  const { useAuthStore } = await import('../../../lib/store');
  if (!useAuthStore.persist.hasHydrated()) {
    await useAuthStore.persist.rehydrate();
  }
  useAuthStore.getState().setAuth(user, data.token, data.refreshToken || '');
  logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
    userId: user?.id,
    endpoint: '/api/auth/login',
    httpStatus: response.status,
    sessionExpiresAt: data.refreshTokenExpiresAt || null,
    remember: Boolean(payload.remember),
  });
  broadcastAuthMessage('LOGIN', { userId: user?.id });

  return data;
}

function normalizeAdminUser(user, email) {
  const role = user?.role || user?.roleType || '';
  const fullName = user?.fullName || user?.name || [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ') || '';
  const isSuperOrAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  return {
    id: user?.id,
    email: user?.email || email,
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    fullName: fullName || (isSuperOrAdmin ? 'Super Admin' : ''),
    name: fullName || (isSuperOrAdmin ? 'Super Admin' : ''),
    avatar: user?.avatar || null,
    phone: user?.phone || null,
    customerId: user?.customerId ?? user?.customer?.id ?? null,
    role: isSuperOrAdmin ? 'SUPER_ADMIN' : role,
    roles: Array.isArray(user?.roles) && user.roles.length ? user.roles : (role ? [role] : []),
  };
}

export { clearSession } from './admin-session';

let logoutRequest;

export async function logoutAdmin() {
  if (logoutRequest) return logoutRequest;
  logoutRequest = (async () => {
    const [{ readSession, clearSession }, { useAuthStore }] = await Promise.all([
      import('./admin-session'),
      import('../../../lib/store'),
    ]);
    const session = readSession();
    const token = session?.token || (typeof window !== 'undefined' ? window.localStorage.getItem('qb_admin_token') || window.localStorage.getItem('accessToken') : null);
    const refreshToken = useAuthStore.getState().refreshToken || session?.refreshToken ||
      (typeof window !== 'undefined' ? window.localStorage.getItem('qb_admin_refresh_token') || window.localStorage.getItem('refreshToken') || window.sessionStorage.getItem('refreshToken') : null);
    let revoked = false;
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ refreshToken, accessToken: token }),
      });
      const data = await response.json().catch(() => ({}));
      revoked = response.ok && (data?.revoked === true || data?.success === true);
    } catch {
      // Local state is still cleared below when the server is unreachable.
    } finally {
      clearSession();
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('qb_admin_token');
          localStorage.removeItem('qb_admin_user');
          localStorage.removeItem('qb_admin_refresh_token');
          localStorage.removeItem('qb_admin_remember');
          sessionStorage.removeItem('qb_admin_token');
          sessionStorage.removeItem('qb_admin_user');
          sessionStorage.removeItem('qb_admin_refresh_token');
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('quikboom-next-auth-storage');
        } catch {}
      }
      logoutRequest = undefined;
    }
    return { revoked };
  })();
  return logoutRequest;
}
