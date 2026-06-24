import type { DayTotals } from '@/lib/records';

const STYLES = {
  grid: 'grid grid-cols-2 gap-3 sm:grid-cols-4',
  card: 'rounded-lg border border-border bg-surface p-4',
  label: 'text-xs text-muted',
  value: 'mt-1 text-xl font-semibold tabular-nums text-foreground',
  unit: 'ml-1 text-sm font-normal text-muted',
} as const;

export function MetricCards({ totals, count }: { totals: DayTotals; count: number }) {
  const cards = [
    { label: '섭취', value: totals.calories, unit: 'kcal' },
    { label: '소모', value: totals.caloriesBurned, unit: 'kcal' },
    { label: '순 칼로리', value: totals.calories - totals.caloriesBurned, unit: 'kcal' },
    { label: '기록', value: count, unit: '건' },
  ];
  return (
    <div className={STYLES.grid}>
      {cards.map((c) => (
        <div key={c.label} className={STYLES.card}>
          <p className={STYLES.label}>{c.label}</p>
          <p className={STYLES.value}>
            {c.value.toLocaleString()}
            <span className={STYLES.unit}>{c.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
