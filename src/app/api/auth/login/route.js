const SESSION_COOKIE = 'qb_admin_session';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function extractToken(body) {
  return (
    body?.token ||
    body?.access_token ||
    body?.accessToken ||
    body?.data?.token ||
    body?.data?.access_token
  );
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

  const apiBase =
    process.env.API_BASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

  if (!apiBase) {
    return Response.json(
      {
        message:
          'Authentication API is not configured. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.',
      },
      { status: 503 },
    );
  }

  const upstream = await fetch(`${apiBase}/admin/auth/login/super-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

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
          body?.message ||
          body?.detail ||
          body?.error ||
          'Sign in failed. Please verify your credentials.',
      },
      { status: upstream.status },
    );
  }

  const token = extractToken(body);
  const user = body?.user || body?.data?.user || { email };

  const response = Response.json({
    token,
    user,
    redirectTo: '/admin/dashboard',
  });

  if (token) {
    response.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${
        remember ? `; Max-Age=${THIRTY_DAYS}` : ''
      }`,
    );
  }

  return response;
}
