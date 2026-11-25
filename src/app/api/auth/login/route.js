const SEVEN_DAYS = 60 * 60 * 24 * 7;

function extractAuth(body) {
  const tokens = body?.data?.tokens || body?.tokens || body?.data || {};
  const token =
    tokens.accessToken ||
    tokens.token ||
    body?.accessToken ||
    body?.token ||
    body?.data?.accessToken ||
    body?.data?.token ||
    null;
  const refreshToken =
    tokens.refreshToken ||
    body?.refreshToken ||
    body?.data?.refreshToken ||
    null;
  const user = body?.data?.user || body?.user || null;
  const sessionPolicy = tokens.sessionPolicy || body?.sessionPolicy || body?.data?.sessionPolicy || null;
  return {
    token,
    refreshToken,
    user,
    expiresIn: tokens.expiresIn || body?.expiresIn || null,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt || body?.accessTokenExpiresAt || null,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt || body?.refreshTokenExpiresAt || null,
    sessionPolicy,
  };
}

function isHttps(request) {
  const forwarded = request.headers.get('x-forwarded-proto');
  return forwarded ? forwarded.split(',')[0].trim() === 'https' : new URL(request.url).protocol === 'https:';
}

function buildCookie(name, value, { secure, maxAge }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const email = payload?.email?.trim();
  const password = payload?.password;
  const remember = Boolean(payload?.remember);

  if (!email || !password) {
    return Response.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  const candidateBases = Array.from(new Set([
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:3000/api/v1',
    'https://api.qbapp.online/api/v1',
  ].filter(Boolean).map((url) => url.replace(/\/$/, ''))));

  let upstream;
  let lastError;

  for (const apiBase of candidateBases) {
    try {
      upstream = await fetch(`${apiBase}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-client-type': 'admin' },
        body: JSON.stringify({ email, password, rememberMe: remember }),
        cache: 'no-store',
      });
      // Older backend deployments reject fields they do not recognize.
      if (upstream.status === 400) {
        const error = await upstream.clone().json().catch(() => null);
        const messages = Array.isArray(error?.message) ? error.message : [error?.message];
        if (messages.some((message) => message === 'property rememberMe should not exist')) {
          upstream = await fetch(`${apiBase}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-client-type': 'admin' },
            body: JSON.stringify({ email, password }),
            cache: 'no-store',
          });
        }
      }
      if (upstream) {
        lastError = null;
        break;
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!upstream) {
    console.error('[API_AUTH_LOGIN_ERROR] All upstream candidates failed:', lastError);
    return Response.json(
      { message: 'Authentication service is unavailable. Please verify the backend service is running.' },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!upstream.ok) {
    return Response.json(
      {
        message:
          (Array.isArray(body?.message) ? body.message.join(' ') : body?.message) ||
          body?.detail ||
          body?.error ||
          'Sign in failed. Please verify your credentials.',
      },
      { status: upstream.status },
    );
  }

  const auth = extractAuth(body);
  const token = auth.token;
  const user = auth.user || { email };
  const secure = isHttps(request);

  const response = Response.json({
    token,
    refreshToken: auth.refreshToken,
    user,
    expiresIn: auth.expiresIn,
    accessTokenExpiresAt: auth.accessTokenExpiresAt,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
    sessionPolicy: auth.sessionPolicy,
    redirectTo: '/admin/dashboard',
  });

  if (token) {
    response.headers.append(
      'Set-Cookie',
      buildCookie('qb_admin_session', token, { secure, maxAge: SEVEN_DAYS }),
    );
  }
  if (auth.refreshToken) {
    response.headers.append(
      'Set-Cookie',
      buildCookie('qb_admin_refresh', auth.refreshToken, { secure, maxAge: SEVEN_DAYS }),
    );
  }
  response.headers.append(
    'Set-Cookie',
    buildCookie('qb_admin_remember', remember ? '1' : '0', { secure, maxAge: SEVEN_DAYS }),
  );

  return response;
}
