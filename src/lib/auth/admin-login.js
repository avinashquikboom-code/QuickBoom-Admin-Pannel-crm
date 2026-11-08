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
      data?.message ||
      data?.detail ||
      data?.error ||
      'Unable to sign in. Check your credentials and try again.';
    throw new Error(message);
  }

  if (data?.token) {
    persistSession({
      token: data.token,
      user: data.user ?? null,
      remember: payload.remember,
    });
  }

  return data;
}

export { clearSession } from './admin-session';

export async function logoutAdmin() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    const { clearSession } = await import('./admin-session');
    clearSession();
  }
}
