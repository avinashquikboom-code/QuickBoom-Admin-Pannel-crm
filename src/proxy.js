import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'qb_admin_session';
const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.qbapp.online/api/v1'
).replace(/\/$/, '');

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/hrm')) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    if (session === '1') {
      return NextResponse.next();
    }
    if (session.split('.').length === 3) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${session}`, Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) return NextResponse.next();
      } catch {
        // Fail closed when the API cannot confirm the session.
      }
    }
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  const redirect = NextResponse.redirect(loginUrl);
  redirect.cookies.delete(SESSION_COOKIE);
  return redirect;
}

export const config = {
  matcher: ['/admin/:path*', '/hrm/:path*'],
};
