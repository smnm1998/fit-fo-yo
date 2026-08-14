import { NextResponse, type NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';
const APP_HOME = '/dashboard';
const AUTH_ROUTES = ['/login', '/signup'];
const PROTECTED_PREFIXES = ['/dashboard', '/calendar', '/record'];

type Tokens = { accessToken: string; refreshToken: string };

/** JWT exp를 검증 없이 읽어 만료(±30s) 여부만 판단 */
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    if (!json.exp) return true;
    return Date.now() >= json.exp * 1000 - 30_000;
  } catch {
    return true;
  }
}

async function tryRefresh(refreshToken: string): Promise<Tokens | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const { tokens } = (await res.json()) as { tokens: Tokens };
    return tokens;
  } catch {
    return null;
  }
}

function setAuthCookies(res: NextResponse, tokens: Tokens): void {
  res.cookies.set('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  res.cookies.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let access = req.cookies.get('access_token')?.value;
  const refresh = req.cookies.get('refresh_token')?.value;

  // 1) access 만료/부재 + refresh 있으면 먼저 갱신 (가드보다 앞서야 로그인으로 안 튕김)
  let refreshed: Tokens | null = null;
  if ((!access || isExpired(access)) && refresh) {
    refreshed = await tryRefresh(refresh);
    if (refreshed) {
      access = refreshed.accessToken;
      req.cookies.set('access_token', refreshed.accessToken); // 현재 요청 다운스트림용
    }
  }

  const hasToken = Boolean(access);

  // 2) 라우트 가드 (갱신 반영된 상태로)
  let res: NextResponse;
  if (hasToken && (pathname === '/' || AUTH_ROUTES.some((p) => pathname.startsWith(p)))) {
    res = NextResponse.redirect(new URL(APP_HOME, req.url));
  } else if (!hasToken && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next({ request: { headers: req.headers } });
  }

  // 3) 갱신했으면 어떤 응답(리다이렉트/통과)이든 새 쿠키 심기
  if (refreshed) setAuthCookies(res, refreshed);

  return res;
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/stats/:path*',
    '/record/:path*',

    '/api/records/:path*',
    '/api/recommendations/:path*',
    '/api/health-profile/:path*',
    '/api/ai/:path*',
  ],
};
