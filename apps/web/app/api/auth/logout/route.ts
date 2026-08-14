import { apiFetchAuth } from '@/lib/server/api';
import { clearAuthCookies } from '@/lib/server/auth-cookies';
import { NextResponse } from 'next/server';

export async function POST() {
  await apiFetchAuth('/auth/logout', { method: 'POST' });
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
