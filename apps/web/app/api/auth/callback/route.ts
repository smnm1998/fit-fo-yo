import { apiFetch, proxyJson } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import type { AuthResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const fail = new URL('/login?error=oauth', url.origin);

  if (!code) return NextResponse.redirect(fail);

  // server-2-server 코드 교환 (토큰 브라우저에 노출 x)
  let res: Response;
  try {
    res = await apiFetch('/auth/oauth/exchange', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch (error) {
    console.error('[BFF] oauth exchange unreachable', error);
    return NextResponse.redirect(fail);
  }

  const { ok, data } = await proxyJson(res);
  if (!ok) return NextResponse.redirect(fail);

  await setAuthCookies((data as AuthResponse).tokens);
  return NextResponse.redirect(new URL('/dashboard', url.origin));
}
