import { proxyAuth, readJson } from '@/lib/server/api';

export async function GET(req: Request) {
  const qs = new URL(req.url).searchParams.toString();
  return proxyAuth(`/records${qs ? `?${qs}` : ''}`);
}

export async function POST(req: Request) {
  const json = await readJson(req);
  if (!json.ok) return json.response;
  return proxyAuth('/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json.body),
  });
}
