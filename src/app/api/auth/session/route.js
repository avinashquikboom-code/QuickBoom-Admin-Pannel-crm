const SESSION_COOKIE = 'qb_admin_session';
const REFRESH_COOKIE = 'qb_admin_refresh';
const REMEMBER_COOKIE = 'qb_admin_remember';
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

export async function GET(request) {
  const session = request.cookies.get(SESSION_COOKIE)?.value || null;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value || null;
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === '1';

  return Response.json({
    authenticated: Boolean(session || refresh),
    hasAccessCookie: Boolean(session),
    hasRefreshCookie: Boolean(refresh),
    remember,
  });
}

export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
  const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
  if (!token) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const rememberCookie = request.cookies.get(REMEMBER_COOKIE)?.value === '1';
  const remember = payload?.remember !== undefined ? Boolean(payload.remember) : rememberCookie;
  const secure = isHttps(request);

  const response = Response.json({ ok: true });
  response.headers.append(
    'Set-Cookie',
    buildCookie(SESSION_COOKIE, token, { secure, maxAge: remember ? THIRTY_DAYS : TWENTY_FOUR_HOURS }),
  );
  if (refreshToken) {
    response.headers.append(
      'Set-Cookie',
      buildCookie(REFRESH_COOKIE, refreshToken, { secure, maxAge: remember ? THIRTY_DAYS : undefined }),
    );
  }
  return response;
}
