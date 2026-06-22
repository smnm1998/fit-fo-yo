import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const res = await apiFetchAuth(`/records${qs ? `${qs}` : ''}`, { method: 'GET' });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
