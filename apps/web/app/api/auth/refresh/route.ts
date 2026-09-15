import { apiFetch, proxyJson, upstreamDown } from '@/lib/server/api';
import { clearAuthCookies, setAuthCookies } from '@/lib/server/auth-cookies';
import type { AuthResponse } from '@/lib/types';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const refreshToken = (await cookies()).get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  let res: Response;
  try {
    res = await apiFetch('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  } catch (error) {
    return upstreamDown(error, '/auth/refresh');
  }

  const { ok, data, response } = await proxyJson(res);
  if (!ok) {
    // 토큰이 실제로 거부된 경우에만 세션 폐기
    // 5xx는 일시 장애로 보고 쿠키 유지
    if (res.status === 401 || res.status === 403) {
      await clearAuthCookies();
    }
    return response;
  }

  await setAuthCookies((data as AuthResponse).tokens);
  return NextResponse.json({ ok: true });
}
