import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'qb_admin_session';
const REFRESH_COOKIE = 'qb_admin_refresh';
const REMEMBER_COOKIE = 'qb_admin_remember';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.qbapp.online/api/v1'
).replace(/\/$/, '');

function isHttps(request) {
  const forwarded = request.headers.get('x-forwarded-proto');
  return forwarded ? forwarded.split(',')[0].trim() === 'https' : new URL(request.url).protocol === 'https:';
}

function isJwtExpiredSoon(token, skewMs = 10000) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}

async function tryServerRefresh(refreshToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-client-type': 'admin' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) {
      return { status: 'revoked' };
    }
    if (!res.ok) {
      return { status: 'transient_error' };
    }
    const body = await res.json().catch(() => ({}));
    const tokens = body?.data?.tokens || body?.tokens || body?.data || body || {};
    const accessToken = tokens.accessToken || tokens.token || body?.accessToken || null;
    const nextRefresh = tokens.refreshToken || body?.refreshToken || refreshToken;
    if (!accessToken) {
      return { status: 'transient_error' };
    }
    return {
      status: 'refreshed',
      accessToken,
      refreshToken: nextRefresh,
      rememberMe: Boolean(tokens?.sessionPolicy?.rememberMe),
    };
  } catch {
    return { status: 'transient_error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/hrm')) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (session === '1') {
    return NextResponse.next();
  }

  // 1. If we have a non-expired access token cookie, validate with backend profile
  if (session && session.split('.').length === 3 && !isJwtExpiredSoon(session)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${session}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (response.ok) {
        return NextResponse.next();
      }
      // Do NOT log out on 5xx / 429 / transient gateway errors
      if (response.status >= 500 || response.status === 429 || response.status === 408) {
        return NextResponse.next();
      }
    } catch {
      // Network/timeout error during SSR navigation — let client AuthSessionManager handle retry
      return NextResponse.next();
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Access token missing, expired, or returned 401 — attempt silent refresh via HttpOnly refresh cookie
  if (refresh) {
    const refreshed = await tryServerRefresh(refresh);
    if (refreshed.status === 'refreshed') {
      const nextRes = NextResponse.next();
      const secure = isHttps(request);
      nextRes.cookies.set(SESSION_COOKIE, refreshed.accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        maxAge: SEVEN_DAYS,
      });
      nextRes.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        maxAge: SEVEN_DAYS,
      });
      return nextRes;
    }
    if (refreshed.status === 'transient_error') {
      return NextResponse.next();
    }
  }

  // 3. Session is definitively missing or revoked -> redirect to login with safe next param
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  if (session || refresh) {
    loginUrl.searchParams.set('reason', 'session_expired');
  }
  const redirect = NextResponse.redirect(loginUrl);
  redirect.cookies.delete(SESSION_COOKIE);
  redirect.cookies.delete(REFRESH_COOKIE);
  redirect.cookies.delete(REMEMBER_COOKIE);
  return redirect;
}

export const config = {
  matcher: ['/admin/:path*', '/hrm/:path*'],
};
