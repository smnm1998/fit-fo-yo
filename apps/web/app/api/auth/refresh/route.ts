import { apiFetch } from '@/lib/server/api';
import { clearAuthCookies, setAuthCookies } from '@/lib/server/auth-cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const refreshToken = (await cookies()).get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  const res = await apiFetch('/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    await clearAuthCookies();
    return NextResponse.json(data, { status: res.status });
  }

  await setAuthCookies(data.tokens);
  return NextResponse.json({ ok: true });
}
