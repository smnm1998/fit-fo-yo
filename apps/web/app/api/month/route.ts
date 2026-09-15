import { monthRangeKST } from '@/lib/date';
import { apiFetchAuth, proxyJson, upstreamDown } from '@/lib/server/api';
import type { RecordDto, RecommendationDto } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get('month') ?? '';
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ message: '잘못된 month 형식' }, { status: 400 });
  }

  const { from, to } = monthRangeKST(month);
  const recordsPath = `/records?${new URLSearchParams({ from, to, limit: '200' })}`;
  const recoPath = `/recommendations?${new URLSearchParams({ from, to })}`;

  // 두 api 호출을 서버에서 병렬 -> 브라우저엔 1응답
  let recordsRes: Response;
  let recoRes: Response;
  try {
    [recordsRes, recoRes] = await Promise.all([apiFetchAuth(recordsPath), apiFetchAuth(recoPath)]);
  } catch (error) {
    return upstreamDown(error, `${recordsPath} | ${recoPath}`);
  }

  // 하나라도 실패하면 그 상태코드로 정직하게 전파
  const records = await proxyJson(recordsRes);
  if (!records.ok) return records.response;

  const reco = await proxyJson(recoRes);
  if (!reco.ok) return reco.response;

  const items = (records.data as { items?: RecordDto[] })?.items;
  if (!Array.isArray(items) || !Array.isArray(reco.data)) {
    console.error('[BFF] /month 업스트림 응답 형태가 계약과 다름', {
      records: typeof records.data,
      reco: typeof reco.data,
    });
    return NextResponse.json(
      { message: '서버 응답 형식이 올바르지 않습니다.' },
      {
        status: 502,
      },
    );
  }

  return NextResponse.json({ records: items, recommendations: reco.data as RecommendationDto[] });
}
