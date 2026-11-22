import { apiFetch } from '@/lib/server/api';
import { clearAuthCookies } from '@/lib/server/auth-cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // api는 refresh 토큰으로 사용자 식별. access가 만료돼도 서버 세션을 지울 수 있음
  const refreshToken = (await cookies()).get('refresh_token')?.value;

  // 업스트림 성공 여부와 무관하게 브라우저 쿠키는 반드시 지움
  if (refreshToken) {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
    } catch (error) {
      console.error('[BFF] logout upstream failed', error);
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
