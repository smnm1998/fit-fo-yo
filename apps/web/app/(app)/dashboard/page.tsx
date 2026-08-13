import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { getCurrentUser } from '@/lib/server/user';
import { currentMonthKST, monthRangeKST, todayKST, weekDayKeysAgoKST } from '@/lib/date';
import { weekStreak } from '@/lib/records';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CalendarWorkspace } from '@/components/dashboard/CalendarWorkspace';
import type { RecommendationDto, RecordDto } from '@/lib/types';

export const metadata: Metadata = { title: '캘린더' };

async function getMonthRecords(month: string): Promise<RecordDto[]> {
  const { from, to } = monthRangeKST(month);
  const qs = new URLSearchParams({ from, to, limit: '200' });
  const res = await apiFetchAuth(`/records?${qs.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RecordDto[] };
  return data.items;
}

async function getMonthRecommendations(month: string): Promise<RecommendationDto[]> {
  const { from, to } = monthRangeKST(month);
  const qs = new URLSearchParams({ from, to });
  const res = await apiFetchAuth(`/recommendations?${qs.toString()}`);
  if (!res.ok) return [];
  return (await res.json()) as RecommendationDto[];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonthKST();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKST();
  const [user, initialRecords, initialRecommendations] = await Promise.all([
    getCurrentUser(),
    getMonthRecords(month),
    getMonthRecommendations(month),
  ]);
  const streak = weekStreak(initialRecords, weekDayKeysAgoKST(0));

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader nickname={user?.nickname} streak={streak} />

      <CalendarWorkspace
        initialMonth={month}
        initialDate={date}
        initialRecords={initialRecords}
        initialRecommendations={initialRecommendations}
      />
    </div>
  );
}
