import { proxyAuth, readJson } from '@/lib/server/api';

/** id는 경로에 그대로 넣지 않는다 ('../' 같은 값이 api의 다른 경로를 가리키지 않게) */
const recordPath = (id: string) => `/records/${encodeURIComponent(id)}`;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAuth(recordPath(id), { method: 'DELETE' });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await readJson(req);
  if (!json.ok) return json.response;
  return proxyAuth(recordPath(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json.body),
  });
}
