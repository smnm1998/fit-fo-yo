import { NextResponse, type NextRequest } from 'next/server';

const APP_HOME = '/dashboard';
const AUTH_ROUTES = ['/login', '/signup'];
const PROTECTED_PREFIXES = ['/dashboard', '/calendar', '/record'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get('access_token')?.value);

  if (hasToken && (pathname === '/' || AUTH_ROUTES.some((p) => pathname.startsWith(p)))) {
    return NextResponse.redirect(new URL(APP_HOME, req.url));
  }

  if (!hasToken && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/stats/:path*',
    '/record/:path*',
  ],
};
