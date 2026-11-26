import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetchAuth } from '@/lib/server/api';
import { fetchRecordsInRange } from '@/lib/server/records';

vi.mock('@/lib/server/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/api')>()),
  apiFetchAuth: vi.fn(),
}));

const fetchMock = vi.mocked(apiFetchAuth);

function record(n: number) {
  return {
    id: `r${n}`,
    type: 'DIET',
    rawInput: '',
    recordedAt: '2026-11-01T03:00:00.000Z',
    createdAt: '2026-11-01T03:00:00.000Z',
    dietItems: [],
    exerciseItems: [],
  };
}

/** api처럼 offset·limit으로 잘라 주는 가짜 /records (전체 total건) */
function serveRecords(total: number) {
  fetchMock.mockImplementation((path: string) => {
    const qs = new URL(path, 'http://api').searchParams;
    const offset = Number(qs.get('offset'));
    const limit = Number(qs.get('limit'));
    const count = Math.max(0, Math.min(limit, total - offset));
    const items = Array.from({ length: count }, (_, i) => record(offset + i));
    return Promise.resolve(Response.json({ items, total, limit, offset }));
  });
}

const offsets = () =>
  fetchMock.mock.calls.map(([path]) => new URL(path, 'http://api').searchParams.get('offset'));

describe('fetchRecordsInRange', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('200건 이하면 한 번만 부른다', async () => {
    serveRecords(37);

    const result = await fetchRecordsInRange(
      '2026-10-31T15:00:00.000Z',
      '2026-11-30T14:59:59.999Z',
    );

    expect(result.ok && result.items).toHaveLength(37);
    expect(offsets()).toEqual(['0']);
  });

  it('200건을 넘으면 total까지 이어 받는다 (전에는 200건에서 잘림)', async () => {
    serveRecords(450);

    const result = await fetchRecordsInRange('a', 'b');

    expect(result.ok && result.items.map((r) => r.id)).toEqual(
      Array.from({ length: 450 }, (_, i) => `r${i}`),
    );
    expect(offsets()).toEqual(['0', '200', '400']);
  });

  it('api가 실패하면 그 상태코드를 그대로 넘기고 더 부르지 않는다', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'Unauthorized' }, { status: 401 }));

    const result = await fetchRecordsInRange('a', 'b');

    expect(result.ok).toBe(false);
    expect(!result.ok && result.response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('응답이 계약과 다르면(total 없음) 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(Response.json({ items: [] }));

    const result = await fetchRecordsInRange('a', 'b');

    expect(!result.ok && result.response.status).toBe(502);
  });

  it('total이 비정상적으로 커도 2,000건(10번)에서 멈춘다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    serveRecords(1_000_000);

    const result = await fetchRecordsInRange('a', 'b');

    expect(result.ok && result.items).toHaveLength(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
