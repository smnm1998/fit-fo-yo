import type { Metadata } from 'next';
import { apiFetchAuth } from '@/lib/server/api';
import { weekDayKeysKST, weekRangeKST } from '@/lib/date';
import { sumRecords, sumRecordsByDay } from '@/lib/records';
import { StatsView } from '@/components/stats/StatsView';
import type { RecordDto } from '@/lib/types';
import { MetricCards } from '@/components/stats/MetricCards';

export const metadata: Metadata = { title: '통계 · FitFoYo' };

async function getWeekRecords(): Promise<RecordDto[]> {
  const { from, to } = weekRangeKST();
  const qs = new URLSearchParams({ from, to, limit: '200' });
  const res = await apiFetchAuth(`/records?${qs.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items: RecordDto[] };
  return data.items;
}

export default async function StatsPage() {
  const records = await getWeekRecords();
  const daily = sumRecordsByDay(records, weekDayKeysKST());
  const totals = sumRecords(records);
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">이번 주 합계</h2>
        <MetricCards totals={totals} count={records.length} />
      </section>
      <StatsView
        daily={daily}
        macros={{ carbs: totals.carbs, protein: totals.protein, fat: totals.fat }}
      />
    </div>
  );
}
