import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await apiFetchAuth('/ai/parse-and-saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
