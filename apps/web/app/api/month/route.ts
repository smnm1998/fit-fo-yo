import { monthRangeKST } from '@/lib/date';
import { apiFetchAuth, proxyJson, upstreamDown } from '@/lib/server/api';
import { fetchRecordsInRange, type RecordsInRange } from '@/lib/server/records';
import type { RecommendationDto } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get('month') ?? '';
  if (!/^\d{4}-\d{2}$/u.test(month)) {
    return NextResponse.json({ message: '잘못된 month 형식' }, { status: 400 });
  }

  const { from, to } = monthRangeKST(month);
  const recoPath = `/recommendations?${new URLSearchParams({ from, to })}`;

  // 두 api 호출을 서버에서 병렬 -> 브라우저엔 1응답
  let records: RecordsInRange;
  let recoRes: Response;
  try {
    [records, recoRes] = await Promise.all([fetchRecordsInRange(from, to), apiFetchAuth(recoPath)]);
  } catch (error) {
    return upstreamDown(error, `/records ${month} | ${recoPath}`);
  }

  // 하나라도 실패하면 그 상태코드로 정직하게 전파
  if (!records.ok) return records.response;

  const reco = await proxyJson(recoRes);
  if (!reco.ok) return reco.response;

  if (!Array.isArray(reco.data)) {
    console.error('[BFF] /month 추천 응답 형태가 계약과 다름', typeof reco.data);
    return NextResponse.json(
      { message: '서버 응답 형식이 올바르지 않습니다.' },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({
    records: records.items,
    recommendations: reco.data as RecommendationDto[],
  });
}
