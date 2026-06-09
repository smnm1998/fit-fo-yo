import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await apiFetchAuth('/auth/me');
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
