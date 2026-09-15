import { proxyAuth } from '@/lib/server/api';

export function GET() {
  return proxyAuth('/health-profile');
}

export async function PUT(req: Request) {
  const body = await req.json();
  return proxyAuth('/health-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
