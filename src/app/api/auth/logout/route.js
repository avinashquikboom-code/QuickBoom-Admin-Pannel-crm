import { cookies } from 'next/headers';

const SESSION_COOKIE = 'qb_admin_session';
const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.qbapp.online/api/v1'
).replace(/\/$/, '');

function clearSessionCookie(request, response) {
  const forwarded = request.headers.get('x-forwarded-proto');
  const secure = forwarded ? forwarded.split(',')[0].trim() === 'https' : new URL(request.url).protocol === 'https:';
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=0`,
  );
  return response;
}

export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    // The cookie still needs to be cleared even if the client sent no body.
  }

  const authHeader = request.headers.get('authorization');
  const accessToken = payload?.accessToken || authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] || null;
  const refreshToken = payload?.refreshToken || null;

  const candidateBases = Array.from(new Set([
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:3000/api/v1',
    'https://api.qbapp.online/api/v1',
  ].filter(Boolean).map(url => url.replace(/\/$/, ''))));

  let upstream;
  for (const apiBase of candidateBases) {
    try {
      upstream = await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken, accessToken }),
        cache: 'no-store',
      });
      if (upstream) break;
    } catch {}
  }

  const result = upstream ? await upstream.json().catch(() => ({})) : {};
  const revoked = Boolean(
    upstream?.ok && (result?.revokedAccessToken === true || Number(result?.revokedRefreshTokens) > 0 || result?.success === true)
  );
  return clearSessionCookie(request, Response.json(
    { ...result, ok: Boolean(upstream?.ok), revoked },
    { status: upstream?.ok ? 200 : 200 },
  ));
}
