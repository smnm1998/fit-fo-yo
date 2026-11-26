import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, writeAuthCookies } from '@/lib/auth-cookie';
import type { AuthTokens } from '@/lib/types';

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  writeAuthCookies(await cookies(), tokens);
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
