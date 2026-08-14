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

  store.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete('access_token');
  store.delete({ name: 'refresh_token', path: '/api/auth/refresh' });
}
