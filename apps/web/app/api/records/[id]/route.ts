import { apiFetchAuth } from '@/lib/server/api';
import { NextResponse } from 'next/server';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetchAuth(`/records/${id}`, { method: 'DELETE' });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await apiFetchAuth(`/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
