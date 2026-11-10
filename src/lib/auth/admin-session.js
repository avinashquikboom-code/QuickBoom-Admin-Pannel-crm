const TOKEN_KEY = 'qb_admin_token';
const USER_KEY = 'qb_admin_user';
const REMEMBER_KEY = 'qb_admin_remember';

function storage(remember) {
  if (typeof window === 'undefined') {
    return null;
  }
  return remember ? window.localStorage : window.sessionStorage;
}

export function persistSession({ token, user, remember }) {
  const store = storage(remember);
  if (!store || !token) {
    return;
  }
  store.setItem(TOKEN_KEY, token);
  if (user) {
    store.setItem(USER_KEY, JSON.stringify(user));
  }
  if (remember) {
    window.localStorage.setItem(REMEMBER_KEY, '1');
  } else {
    window.localStorage.removeItem(REMEMBER_KEY);
  }
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
}

export function readSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  const remember = window.localStorage.getItem(REMEMBER_KEY) === '1';
  const store = storage(remember) || window.sessionStorage;
  const token = store.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY);
  const rawUser = store.getItem(USER_KEY) || window.localStorage.getItem(USER_KEY);
  if (!token) {
    return null;
  }
  try {
    return {
      token,
      user: rawUser ? JSON.parse(rawUser) : null,
      remember,
    };
  } catch {
    return { token, user: null, remember };
  }
}

export function getAuthToken() {
  return readSession()?.token ?? null;
}

// Update only the active authenticated account; keep credentials and remember mode.
export function updateSessionUser(user) {
  const session = readSession();
  if (!session || !user || (session.user?.id && String(session.user.id) !== String(user.id))) return;
  const store = storage(session.remember);
  store.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('qb-admin-profile-updated'));
}
