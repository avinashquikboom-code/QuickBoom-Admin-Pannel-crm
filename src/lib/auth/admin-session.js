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
  if (typeof window === 'undefined' || !token) {
    return;
  }
  const encodedUser = user ? JSON.stringify(user) : null;
  const primary = storage(remember);
  primary?.setItem(TOKEN_KEY, token);
  if (encodedUser) primary?.setItem(USER_KEY, encodedUser);
  // localStorage is shared by new tabs. sessionStorage alone is not.
  window.localStorage.setItem(TOKEN_KEY, token);
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
  let token = store.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY);
  let rawUser = store.getItem(USER_KEY) || window.localStorage.getItem(USER_KEY);

  if (!token) {
    token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
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
      }
    } catch {}
  }

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
