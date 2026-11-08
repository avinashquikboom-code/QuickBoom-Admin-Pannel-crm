import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'qb_admin_session';
const PUBLIC_PREFIXES = ['/login', '/forgot-password', '/api/auth', '/api/admin'];

function isPublicPath(pathname) {
  if (pathname === '/') {
    return false;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request) {
  const enforce = process.env.ADMIN_AUTH_ENFORCE === 'true';
  if (!enforce) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
