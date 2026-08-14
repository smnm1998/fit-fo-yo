import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function POST() {
  const res = await apiFetchAuth('/recommendations/generate', { method: 'POST' });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
