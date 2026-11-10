import { persistSession } from './admin-session';

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
    user,
    remember: Boolean(payload.remember),
  });
  const { useAuthStore } = await import('../../../lib/store');
  if (!useAuthStore.persist.hasHydrated()) {
    await useAuthStore.persist.rehydrate();
  }
  useAuthStore.getState().setAuth(user, data.token, data.refreshToken || '');

  return data;
}

function normalizeAdminUser(user, email) {
  const role = user?.role || user?.roleType || '';
  return {
    id: user?.id,
    email: user?.email || email,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    customerId: user?.customerId ?? user?.customer?.id ?? null,
    role,
    roles: Array.isArray(user?.roles) && user.roles.length ? user.roles : (role ? [role] : []),
  };
}

export { clearSession } from './admin-session';

export async function logoutAdmin() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    const { clearSession } = await import('./admin-session');
    clearSession();
    const { useAuthStore } = await import('../../../lib/store');
    useAuthStore.getState().logout();
  }
}
