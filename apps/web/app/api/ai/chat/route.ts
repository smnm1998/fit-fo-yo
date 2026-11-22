import { proxyAuth } from '@/lib/server/api';

export async function POST(req: Request) {
  const body = await req.json();
  return proxyAuth('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
