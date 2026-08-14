import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await apiFetchAuth('/health-profile', { method: 'GET' });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const res = await apiFetchAuth('/health-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
