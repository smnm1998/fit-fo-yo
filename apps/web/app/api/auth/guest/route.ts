import { apiFetch, proxyJson, upstreamDown } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import type { AuthResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

// 게스트 세션 발급 - web 도메인 쿠키 세팅
export async function POST() {
  let res: Response;
  try {
    res = await apiFetch('/auth/guest', { method: 'POST' });
  } catch (error) {
    return upstreamDown(error, '/auth/guest');
  }

  const { ok, data, response } = await proxyJson(res);
  if (!ok) return response;

  const { user, tokens } = data as AuthResponse;
  await setAuthCookies(tokens);
  return NextResponse.json({ user });
}
