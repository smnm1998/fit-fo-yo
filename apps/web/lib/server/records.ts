import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiFetchAuth, proxyJson } from '@/lib/server/api';
import { RecordPageSchema } from '@/lib/schemas/api';
import type { RecordDto } from '@/lib/types';

/** api가 한 번에 주는 최대 건수 (QueryRecordsDto의 limit 상한과 같게) */
const PAGE_SIZE = 200;
/** 끝없이 돌지 않게 하는 안전장치: 200 × 10 = 2,000건 */
const MAX_PAGES = 10;

export type RecordsInRange =
  | { ok: true; items: RecordDto[] }
  | { ok: false; response: NextResponse };

/**
 * 기간 안의 기록 전부
 * api는 한 번에 200건까지만 주므로, 응답의 total을 보고 offset을 옮겨 가며 이어 받는다
 * (전에는 첫 200건만 받아 그 뒤 기록이 달력·통계에서 말없이 빠졌다)
 * fetch 자체가 실패하면 예외를 그대로 던진다 - 호출한 쪽의 try가 처리
 */
export async function fetchRecordsInRange(from: string, to: string): Promise<RecordsInRange> {
  const items: RecordDto[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({
      from,
      to,
      limit: String(PAGE_SIZE),
      offset: String(items.length),
    });
    const result = await proxyJson(await apiFetchAuth(`/records?${qs.toString()}`));
    if (!result.ok) return { ok: false, response: result.response };

    const parsed = RecordPageSchema.safeParse(result.data);
    if (!parsed.success) {
      console.error('[BFF] /records 응답이 계약과 다름\n', z.prettifyError(parsed.error));
      return {
        ok: false,
        response: NextResponse.json(
          { message: '서버 응답 형식이 올바르지 않습니다.' },
          { status: 502 },
        ),
      };
    }

    items.push(...parsed.data.items);
    if (parsed.data.items.length === 0 || items.length >= parsed.data.total) {
      return { ok: true, items };
    }
  }

  console.warn(`[BFF] /records ${from} ~ ${to}: ${PAGE_SIZE * MAX_PAGES}건에서 멈춤`);
  return { ok: true, items };
}
