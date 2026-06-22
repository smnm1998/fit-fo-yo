import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { todayRangeKST } from '@/lib/date';
import { RecordInput } from '@/components/records/RecordInput';
import { RecordList } from '@/components/records/RecordList';
import { TodaySummary } from '@/components/records/TodaySummary';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { GenerateRecommendation } from '@/components/recommendation/GenerateRecommendation';

export const metadata: Metadata = { title: '오늘 · FitFoYo' };

async function getTodayRecords(): Promise<RecordDto[]> {
  const { from, to } = todayRangeKST();
  const res = await apiFetchAuth(
    `/records?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RecordDto[] };
  return data.items;
}

async function getTodayRecommendation(): Promise<RecommendationDto | null> {
  const res = await apiFetchAuth('/recommendations/today');
  if (!res.ok) return null;
  return (await res.json()) as RecommendationDto;
}

export default async function DashboardPage() {
  const [initial, recommendation] = await Promise.all([
    getTodayRecords(),
    getTodayRecommendation(),
  ]);
  return (
    <section className="flex flex-col gap-6">
      {recommendation ? (
        <RecommendationCard recommendation={recommendation} />
      ) : (
        <GenerateRecommendation />
      )}
      <TodaySummary />
      <div>
        <h1 className="mb-3 text-xl font-semibold text-foreground">오늘의 기록</h1>
        <RecordInput />
      </div>
      <RecordList initial={initial} />
    </section>
  );
}
