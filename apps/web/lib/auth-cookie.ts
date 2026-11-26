import type { AuthTokens } from '@/lib/types';

/**
 * 인증 쿠키의 이름과 옵션 (한 곳)
 * BFF 라우트(next/headers의 cookies())와 proxy.ts(응답의 res.cookies)가 같은 값을 쓰게 한다
 * next/headers를 import하지 않아야 proxy에서도 쓸 수 있다
 */
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/', // proxy.ts가 페이지·BFF 요청마다 refresh를 읽어 access를 갱신하므로 경로는 '/'
} as const;

/** api의 토큰 만료 기본값(access 1h, refresh 7d)과 같게 */
const MAX_AGE = { access: 60 * 60, refresh: 7 * 24 * 60 * 60 } as const;

type CookieOptions = typeof BASE & { maxAge: number };

/** cookies()의 저장소와 res.cookies 둘 다 이 모양의 set을 가진다 */
type CookieWriter = { set(name: string, value: string, options: CookieOptions): unknown };

export function writeAuthCookies(jar: CookieWriter, tokens: AuthTokens): void {
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...BASE, maxAge: MAX_AGE.access });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...BASE, maxAge: MAX_AGE.refresh });
}
