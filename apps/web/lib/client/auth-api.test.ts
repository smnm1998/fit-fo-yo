import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, request } from '@/lib/client/auth-api';
import { NoContentSchema } from '@/lib/schemas/api';

/** fetch가 이 상태 코드와 본문으로 응답하게 한다 */
function respondWith(status: number, body?: unknown) {
  const text = body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(text, { status })),
  );
}

const ItemSchema = z.object({ id: z.string() });

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('응답이 스키마와 맞으면 그 값을 돌려준다 (스키마에 없는 필드는 버림)', async () => {
    respondWith(200, { id: 'a', extra: 1 });

    await expect(request('/api/x', ItemSchema)).resolves.toEqual({ id: 'a' });
  });

  it('성공 응답인데 모양이 다르면 502 ApiError를 던지고 원인을 콘솔에 남긴다', async () => {
    // 트러블 #18: 객체 하나가 올 자리에 배열이 오면, as T로는 그대로 통과했다
    respondWith(200, [{ id: 'a' }]);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const err = await request('/api/x', ItemSchema).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 502 });
    expect(log).toHaveBeenCalledOnce();
  });

  it('실패 응답은 서버가 준 메시지로 ApiError를 던진다', async () => {
    respondWith(400, { message: ['이메일 형식이 아니에요', '비밀번호가 짧아요'] });

    const err = await request('/api/x', ItemSchema).catch((e: unknown) => e);

    expect(err).toMatchObject({
      status: 400,
      message: '이메일 형식이 아니에요\n비밀번호가 짧아요',
    });
  });

  it('실패 응답이 JSON이 아니면 기본 문구를 쓴다', async () => {
    respondWith(502, '<html>Bad Gateway</html>');

    const err = await request('/api/x', ItemSchema).catch((e: unknown) => e);

    expect(err).toMatchObject({ status: 502, message: '요청을 처리하지 못했습니다.' });
  });

  it('204(본문 없음)는 null로 받는다', async () => {
    respondWith(204);

    await expect(request('/api/x', NoContentSchema)).resolves.toBeNull();
  });
});
