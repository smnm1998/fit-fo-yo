import { apiFetch } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const fail = new URL('/login?error=oauth', url.origin);

  if (!code) return NextResponse.redirect(fail);

  // Server-2-Server 코드 교환 -> 토큰 브라우저에 노출 x
  const res = await apiFetch('/auth/oauth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) return NextResponse.redirect(fail);

  const data = await res.json();
  await setAuthCookies(data.tokens);
  return NextResponse.redirect(new URL('/dashboard', url.origin));
}
