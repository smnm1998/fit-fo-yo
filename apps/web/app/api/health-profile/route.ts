import { proxyAuth, readJson } from '@/lib/server/api';

export function GET() {
  return proxyAuth('/health-profile');
}

export async function PUT(req: Request) {
  const json = await readJson(req);
  if (!json.ok) return json.response;
  return proxyAuth('/health-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json.body),
  });
}
