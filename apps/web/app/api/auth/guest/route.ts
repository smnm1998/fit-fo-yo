import { apiFetch } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import { NextResponse } from 'next/server';

// 게스트 세션 발급 - web 도메인 쿠키 세팅
export async function POST() {
  const res = await apiFetch('/auth/guest', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  await setAuthCookies(data.tokens);
  return NextResponse.json({ user: data.user });
}
