import { cookies } from 'next/headers';
import type { AuthTokens } from '@/lib/types';

const isProd = process.env.NODE_ENV === 'production';

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();

  store.set('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  // proxy.ts가 페이지 BFF 요청마다 읽어서 access를 갱신 -> 따라서 경로는 '/'
  store.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete('access_token');
  store.delete('refresh_token');
}
