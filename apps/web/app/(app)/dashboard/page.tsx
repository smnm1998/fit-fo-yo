import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { getCurrentUser } from '@/lib/server/user';
import { fetchRecordsInRange } from '@/lib/server/records';
import {
  currentMonthKST,
  isDayKey,
  monthRangeKST,
  todayKST,
  todayWeekIndexKST,
  weekDayKeysAgoKST,
  weekRangeAgoKST,
} from '@/lib/date';
import { weekStreak } from '@/lib/records';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CalendarWorkspace } from '@/components/dashboard/CalendarWorkspace';
import { RecommendationListSchema } from '@/lib/schemas/api';
import type { RecommendationDto, RecordDto } from '@/lib/types';

export const metadata: Metadata = { title: '캘린더' };

async function getRecords(from: string, to: string): Promise<RecordDto[]> {
  const result = await fetchRecordsInRange(from, to);
  return result.ok ? result.items : [];
}

async function getMonthRecommendations(month: string): Promise<RecommendationDto[]> {
  const { from, to } = monthRangeKST(month);
  const qs = new URLSearchParams({ from, to });
  const res = await apiFetchAuth(`/recommendations?${qs.toString()}`);
  if (!res.ok) return [];
  return RecommendationListSchema.parse(await res.json());
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/u.test(sp.month) ? sp.month : currentMonthKST();
  const date = isDayKey(sp.date) ? sp.date : todayKST();

  const monthRange = monthRangeKST(month);
  const weekRange = weekRangeAgoKST(0);

  const [user, initialRecords, initialRecommendations, weekRecords] = await Promise.all([
    getCurrentUser(),
    getRecords(monthRange.from, monthRange.to),
    getMonthRecommendations(month),
    getRecords(weekRange.from, weekRange.to),
  ]);

  const streak = weekStreak(weekRecords, weekDayKeysAgoKST(0));

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader nickname={user?.nickname} streak={streak} todayIndex={todayWeekIndexKST()} />
      <CalendarWorkspace
        initialMonth={month}
        initialDate={date}
        initialRecords={initialRecords}
        initialRecommendations={initialRecommendations}
      />
    </div>
  );
}
