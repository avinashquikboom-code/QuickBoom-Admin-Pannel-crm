const TOKEN_KEY = 'qb_admin_token';
const USER_KEY = 'qb_admin_user';
const REFRESH_KEY = 'qb_admin_refresh_token';
const REMEMBER_KEY = 'qb_admin_remember';

function storage(remember) {
  if (typeof window === 'undefined') {
    return null;
  }
  return remember ? window.localStorage : window.sessionStorage;
}

export function persistSession({ token, refreshToken, user, remember }) {
  if (typeof window === 'undefined' || !token) {
    return;
  }
  const encodedUser = user ? JSON.stringify(user) : null;
  const primary = storage(remember);
  primary?.setItem(TOKEN_KEY, token);
  if (refreshToken) primary?.setItem(REFRESH_KEY, refreshToken);
  if (encodedUser) primary?.setItem(USER_KEY, encodedUser);
  // localStorage is shared by new tabs. sessionStorage alone is not.
  window.localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
    window.localStorage.setItem('refreshToken', refreshToken);
  }
  if (encodedUser) {
    window.localStorage.setItem(USER_KEY, encodedUser);
    window.localStorage.setItem('user', encodedUser);
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
  window.sessionStorage.removeItem(REFRESH_KEY);
  window.sessionStorage.removeItem('accessToken');
  window.sessionStorage.removeItem('refreshToken');
  window.sessionStorage.removeItem('token');
  window.sessionStorage.removeItem('user');
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  window.localStorage.removeItem('quikboom-next-auth-storage');
  window.dispatchEvent(new Event('qb-admin-session-cleared'));
}

export function readSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  const remember = window.localStorage.getItem(REMEMBER_KEY) === '1';
  const store = storage(remember) || window.sessionStorage;
  let token = store.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY);
  let refreshToken = store.getItem(REFRESH_KEY) || window.localStorage.getItem(REFRESH_KEY);
  let rawUser = store.getItem(USER_KEY) || window.localStorage.getItem(USER_KEY);

  if (!token) {
    token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
  }

  if (!refreshToken) {
    refreshToken = window.localStorage.getItem('refreshToken');
  }

  if (!rawUser) {
    rawUser = window.localStorage.getItem('user');
  }

  if (!rawUser) {
    try {
      const authStorage = window.localStorage.getItem('quikboom-next-auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        if (parsed?.state?.user) {
          rawUser = JSON.stringify(parsed.state.user);
        }
        if (!token && parsed?.state?.token) {
          token = parsed.state.token;
        }
        if (!refreshToken && parsed?.state?.refreshToken) {
          refreshToken = parsed.state.refreshToken;
        }
      }
    } catch {}
  }

  if (!token) {
    return null;
  }
  try {
    return {
      token,
      refreshToken: refreshToken || null,
      user: rawUser ? JSON.parse(rawUser) : null,
      remember,
    };
  } catch {
    return { token, refreshToken: refreshToken || null, user: null, remember };
  }
}

export function getAuthToken() {
  return readSession()?.token ?? null;
}

// Update only the active authenticated account; keep credentials and remember mode.
export function updateSessionUser(user) {
  const session = readSession();
  if (!session || !user) return;
  if (session.user?.id && user?.id && String(session.user.id) !== String(user.id)) return;

  const encoded = JSON.stringify(user);
  try {
    const store = storage(session.remember);
    store?.setItem(USER_KEY, encoded);
    window.localStorage.setItem(USER_KEY, encoded);
    window.sessionStorage.setItem(USER_KEY, encoded);
    window.localStorage.setItem('user', encoded);
  } catch {}

  window.dispatchEvent(new Event('qb-admin-profile-updated'));
}
