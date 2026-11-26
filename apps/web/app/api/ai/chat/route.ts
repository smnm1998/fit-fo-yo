import { proxyAuth, readJson } from '@/lib/server/api';

export async function POST(req: Request) {
  const json = await readJson(req);
  if (!json.ok) return json.response;
  return proxyAuth('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json.body),
  });
}
