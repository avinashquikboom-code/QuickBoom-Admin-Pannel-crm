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

/**
 * @param {{ email: string, password: string, remember: boolean }} payload
 */
export async function loginAdmin(payload) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(' ') : data?.message) ||
      data?.detail ||
      data?.error ||
      'Unable to sign in. Check your credentials and try again.';
    throw new Error(message);
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
