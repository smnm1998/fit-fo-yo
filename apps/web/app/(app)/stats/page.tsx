import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { weekRangeAgoKST, weekDayKeysAgoKST } from '@/lib/date';
import {
  sumRecords,
  sumRecordsByDay,
  partitionByKeys,
  compareWeeks,
  mealDistribution,
} from '@/lib/records';
import { StatsView } from '@/components/stats/StatsView';
import { WeekComparison } from '@/components/stats/WeekComparison';
import { InsightLead } from '@/components/stats/InsightLead';
import type { RecordDto } from '@/lib/types';

export const metadata: Metadata = { title: '통계 · FitFoYo' };

function parseWeek(raw?: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, 12) : 0;
}

async function getRecords(week: number): Promise<RecordDto[]> {
  const { from, to } = weekRangeAgoKST(week, 14);
  const qs = new URLSearchParams({ from, to, limit: '200' });
  const res = await apiFetchAuth(`/records?${qs.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RecordDto[] };
  return data.items;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const week = parseWeek((await searchParams).week);
  const records = await getRecords(week);
  const thisKeys = weekDayKeysAgoKST(week);
  const lastKeys = weekDayKeysAgoKST(week + 1);

  const thisRecs = partitionByKeys(records, thisKeys);
  const lastRecs = partitionByKeys(records, lastKeys);
  const thisTotals = sumRecords(thisRecs);
  const lastTotals = sumRecords(lastRecs);
  const comparison = compareWeeks(thisTotals, lastTotals, thisRecs.length, lastRecs.length);
  const daily = sumRecordsByDay(thisRecs, thisKeys);
  const meals = mealDistribution(thisRecs);

  return (
    <div className="flex flex-col gap-8">
      <InsightLead week={week} weekKeys={thisKeys} data={comparison} count={thisRecs.length} />
      <WeekComparison data={comparison} />
      <StatsView daily={daily} meals={meals} />
    </div>
  );
}
