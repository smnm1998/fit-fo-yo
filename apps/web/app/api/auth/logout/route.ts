import { apiFetchAuth } from '@/lib/server/api';
import { clearAuthCookies } from '@/lib/server/auth-cookies';
import { NextResponse } from 'next/server';

export async function POST() {
  // 업스트림 성공 여부와 무관하게 브라우저 쿠키는 반드시 지움
  try {
    await apiFetchAuth('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('[BFF] logout upstream failed', error);
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
