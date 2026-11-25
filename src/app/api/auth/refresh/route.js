const THIRTY_DAYS = 60 * 60 * 24 * 30;
const TWENTY_FOUR_HOURS = 60 * 60 * 24;

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

function clearAuthCookies(request, response) {
  const secure = isHttps(request);
  response.headers.append('Set-Cookie', buildCookie('qb_admin_session', '', { secure, maxAge: 0 }));
  response.headers.append('Set-Cookie', buildCookie('qb_admin_refresh', '', { secure, maxAge: 0 }));
  response.headers.append('Set-Cookie', buildCookie('qb_admin_remember', '', { secure, maxAge: 0 }));
  return response;
}

function extractTokens(body) {
  const tokens = body?.data?.tokens || body?.tokens || body?.data || {};
  const token =
    tokens.accessToken ||
    tokens.token ||
    body?.accessToken ||
    body?.token ||
    null;
  const refreshToken =
    tokens.refreshToken ||
    body?.refreshToken ||
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

export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    // Allow cookie-only refresh calls
  }

  const cookieRefresh = request.cookies.get('qb_admin_refresh')?.value || null;
  const refreshToken = (payload?.refreshToken || cookieRefresh || '').trim();
  const rememberCookie = request.cookies.get('qb_admin_remember')?.value === '1';

  if (!refreshToken) {
    return clearAuthCookies(
      request,
      Response.json({ message: 'Refresh token is required.', code: 'MISSING_REFRESH_TOKEN' }, { status: 401 }),
    );
  }

  const candidateBases = Array.from(new Set([
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:3000/api/v1',
    'https://api.qbapp.online/api/v1',
  ].filter(Boolean).map((url) => url.replace(/\/$/, ''))));

  let upstream = null;
  let lastError = null;

  for (const apiBase of candidateBases) {
    try {
      const res = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-client-type': 'admin' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (res.status === 404) continue;
      upstream = res;
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!upstream) {
    console.error('[API_AUTH_REFRESH_NETWORK_ERROR]', lastError?.message || lastError);
    return Response.json(
      { message: 'Authentication service temporarily unavailable.', retryable: true },
      { status: 503 },
    );
  }

  const body = await upstream.json().catch(() => ({}));

  if (upstream.status === 401 || upstream.status === 403) {
    return clearAuthCookies(
      request,
      Response.json(
        { message: body?.message || 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' },
        { status: 401 },
      ),
    );
  }

  if (!upstream.ok) {
    return Response.json(
      { message: body?.message || 'Temporary authentication error.', retryable: true },
      { status: upstream.status },
    );
  }

  const extracted = extractTokens(body);
  if (!extracted.token) {
    return Response.json({ message: 'Refresh did not return an access token.', retryable: true }, { status: 502 });
  }

  const remember = Boolean(extracted.sessionPolicy?.rememberMe ?? rememberCookie);
  const secure = isHttps(request);
  const cookieMaxAge = remember ? THIRTY_DAYS : TWENTY_FOUR_HOURS;

  const response = Response.json({
    token: extracted.token,
    accessToken: extracted.token,
    refreshToken: extracted.refreshToken || refreshToken,
    user: extracted.user,
    expiresIn: extracted.expiresIn,
    accessTokenExpiresAt: extracted.accessTokenExpiresAt,
    refreshTokenExpiresAt: extracted.refreshTokenExpiresAt,
    sessionPolicy: extracted.sessionPolicy,
  });

  response.headers.append('Set-Cookie', buildCookie('qb_admin_session', extracted.token, { secure, maxAge: cookieMaxAge }));
  if (extracted.refreshToken) {
    response.headers.append('Set-Cookie', buildCookie('qb_admin_refresh', extracted.refreshToken, { secure, maxAge: remember ? THIRTY_DAYS : undefined }));
  }

  return response;
}
