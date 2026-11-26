import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, writeAuthCookies } from '@/lib/auth-cookie';
import type { AuthTokens } from '@/lib/types';

const APP_HOME = '/dashboard';
const AUTH_ROUTES = ['/login', '/signup'];
const PROTECTED_PREFIXES = ['/dashboard', '/calendar', '/stats', '/chat'];

/** JWT exp를 검증 없이 읽어 만료(±30s) 여부만 판단 */
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = JSON.parse(atob(payload.replace(/-/gu, '+').replace(/_/gu, '/'))) as {
      exp?: number;
    };
    if (!json.exp) return true;
    return Date.now() >= json.exp * 1000 - 30_000;
  } catch {
    return true;
  }
}

/** 'rejected' = api가 토큰을 거부(401/403), null = 일시 장애(5xx, 네트워크)라 쿠키 유지 */
async function tryRefresh(refreshToken: string): Promise<AuthTokens | 'rejected' | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    });
    if (res.status === 401 || res.status === 403) return 'rejected';
    if (!res.ok) return null;
    const { tokens } = (await res.json()) as { tokens: AuthTokens };
    return tokens;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  // 1) access 만료/부재 + refresh 있으면 먼저 갱신 (가드보다 앞서야 로그인으로 안 튕김)
  let refreshed: AuthTokens | 'rejected' | null = null;
  if ((!access || isExpired(access)) && refresh) {
    refreshed = await tryRefresh(refresh);
    if (refreshed && refreshed !== 'rejected') {
      access = refreshed.accessToken;
      req.cookies.set(ACCESS_COOKIE, refreshed.accessToken); // 현재 요청 다운스트림용
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
  // 거부된 refresh 쿠키는 지움 (남겨 두면 요청마다 실패할 갱신을 다시 시도)
  if (refreshed === 'rejected') res.cookies.delete(REFRESH_COOKIE);
  else if (refreshed) writeAuthCookies(res.cookies, refreshed);

  return res;
}

/** proxy가 도는 경로 = 갱신이 필요한 페이지 + 클라이언트가 부르는 BFF 라우트. 페이지·라우트를 추가하면 여기도 추가 */
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/stats/:path*',
    '/chat/:path*',

    '/api/month',
    '/api/records/:path*',
    '/api/health-profile/:path*',
    '/api/ai/:path*',
  ],
};
