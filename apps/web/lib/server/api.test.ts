import { describe, expect, it } from 'vitest';
import { readJson } from '@/lib/server/api';

const post = (body: string) =>
  new Request('http://localhost/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

describe('readJson', () => {
  it('올바른 JSON이면 본문을 돌려준다', async () => {
    await expect(readJson(post('{"type":"DIET"}'))).resolves.toEqual({
      ok: true,
      body: { type: 'DIET' },
    });
  });

  it('깨진 JSON이면 500이 아니라 400 응답을 돌려준다', async () => {
    const result = await readJson(post('{"type":'));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      message: '요청 형식이 올바르지 않습니다.',
    });
  });
});
