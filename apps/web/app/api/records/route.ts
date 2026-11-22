import { proxyAuth } from '@/lib/server/api';

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  return proxyAuth(`/records${qs ? `?${qs}` : ''}`);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyAuth('/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
