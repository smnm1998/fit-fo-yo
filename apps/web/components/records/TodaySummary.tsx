'use client';

import { useRecordsStore } from '@/lib/store/records-store';
import { sumRecords } from '@/lib/records';

const STYLES = {
  wrap: 'grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4',
  stat: 'flex flex-col gap-0.5',
  label: 'text-xs text-muted',
  value: 'text-sm font-semibold tabular-nums text-foreground',
} as const;

export function TodaySummary() {
  const records = useRecordsStore((s) => s.records);
  if (records.length === 0) return null;

  const t = sumRecords(records);
  return (
    <div className={STYLES.wrap}>
      <Stat label="섭취" value={`${t.calories} kcal`} />
      <Stat label="단백질" value={`${t.protein} g`} />
      <Stat label="운동" value={`${t.exerciseMinutes} 분`} />
      <Stat label="소모" value={`${t.caloriesBurned} kcal`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={STYLES.stat}>
      <span className={STYLES.label}>{label}</span>
      <span className={STYLES.value}>{value}</span>
    </div>
  );
}
