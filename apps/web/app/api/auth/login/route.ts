import { apiFetch } from '@/lib/server/api';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  await setAuthCookies(data.tokens);
  return NextResponse.json({ user: data.user });
}
