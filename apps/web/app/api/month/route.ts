import { monthRangeKST } from '@/lib/date';
import { apiFetchAuth } from '@/lib/server/api';
import type { RecordDto, RecommendationDto } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get('month') ?? '';
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ message: '잘못된 month 형식' }, { status: 400 });
  }

  const { from, to } = monthRangeKST(month);
  const recordsQs = new URLSearchParams({ from, to, limit: '200' });
  const recoQs = new URLSearchParams({ from, to });

  // 두 api 호출을 서버에서 병렬 -> 브라우저엔 1응답
  const [recordsRes, recoRes] = await Promise.all([
    apiFetchAuth(`/records?${recordsQs.toString()}`),
    apiFetchAuth(`/recommendations?${recoQs.toString()}`),
  ]);

  // 하나라도 실패하면 그 상태코드로 정직하게 전파
  if (!recordsRes.ok) {
    return NextResponse.json(await recordsRes.json().catch(() => null), {
      status: recordsRes.status,
    });
  }
  if (!recoRes.ok) {
    return NextResponse.json(await recoRes.json().catch(() => null), { status: recoRes.status });
  }

  const records = ((await recordsRes.json()) as { items: RecordDto[] }).items;
  const recommendations = (await recoRes.json()) as RecommendationDto[];

  return NextResponse.json({ records, recommendations });
}
