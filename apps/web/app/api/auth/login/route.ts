import { apiFetch, proxyJson, upstreamDown } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import type { AuthResponse } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  let res: Response;
  try {
    res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return upstreamDown(error, '/auth/login');
  }

  const { ok, data, response } = await proxyJson(res);
  if (!ok) return response;

  const { user, tokens } = data as AuthResponse;
  await setAuthCookies(tokens);
  return NextResponse.json({ user });
}
