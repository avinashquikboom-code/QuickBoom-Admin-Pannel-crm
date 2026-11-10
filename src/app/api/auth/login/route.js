const THIRTY_DAYS = 60 * 60 * 24 * 30;

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
  return { token, refreshToken, user };
}

function sessionCookie(request, remember) {
  const forwarded = request.headers.get('x-forwarded-proto');
  const secure = forwarded ? forwarded.split(',')[0].trim() === 'https' : new URL(request.url).protocol === 'https:';
  const parts = ['qb_admin_session=1', 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (remember) parts.push(`Max-Age=${THIRTY_DAYS}`);
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

  const apiBase = (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.qbapp.online/api/v1'
  ).replace(/\/$/, '');

  let upstream;
  try {
    upstream = await fetch(`${apiBase}/admin/auth/login/super-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return Response.json(
      { message: 'Authentication service is unavailable. Please try again.' },
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

  const response = Response.json({
    token,
    refreshToken: auth.refreshToken,
    user,
    redirectTo: '/admin/dashboard',
  });

  if (token) {
    response.headers.append('Set-Cookie', sessionCookie(request, remember));
  }

  return response;
}
