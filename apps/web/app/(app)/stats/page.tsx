import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { weekRangeKST, weekDayKeysKST, prevWeekDayKeysKST } from '@/lib/date';
import { sumRecords, sumRecordsByDay, partitionByKeys, compareWeeks } from '@/lib/records';
import { StatsView } from '@/components/stats/StatsView';
import { WeekComparison } from '@/components/stats/WeekComparison';
import { WeeklyInsight } from '@/components/stats/WeeklyInsight';
import type { RecordDto } from '@/lib/types';

export const metadata: Metadata = { title: '통계 · FitFoYo' };

async function getRecords(days: number): Promise<RecordDto[]> {
  const { from, to } = weekRangeKST(days);
  const qs = new URLSearchParams({ from, to, limit: '400' });
  const res = await apiFetchAuth(`/records?${qs.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RecordDto[] };
  return data.items;
}

export default async function StatsPage() {
  const records = await getRecords(14);
  const thisKeys = weekDayKeysKST();
  const lastKeys = prevWeekDayKeysKST();

  const thisRecs = partitionByKeys(records, thisKeys);
  const lastRecs = partitionByKeys(records, lastKeys);

  const thisTotals = sumRecords(thisRecs);
  const lastTotals = sumRecords(lastRecs);
  const comparison = compareWeeks(thisTotals, lastTotals, thisRecs.length, lastRecs.length);
  const daily = sumRecordsByDay(thisRecs, thisKeys);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">이번 주 요약</h2>
          <p className="text-xs text-muted">지난주 대비 변화</p>
        </div>
        <WeekComparison data={comparison} />
      </section>
      <WeeklyInsight data={comparison} count={thisRecs.length} />
      <StatsView
        daily={daily}
        macros={{ carbs: thisTotals.carbs, protein: thisTotals.protein, fat: thisTotals.fat }}
      />
    </div>
  );
}
