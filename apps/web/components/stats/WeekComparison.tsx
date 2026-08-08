import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { Trend, WeekComparison as WeekComparisonData } from '@/lib/records';

const STYLES = {
  grid: 'grid grid-cols-2 gap-3 sm:grid-cols-4',
  card: 'rounded-lg border border-border bg-surface p-4',
  label: 'text-xs text-muted',
  value: 'mt-1 text-xl font-semibold tabular-nums text-foreground',
  unit: 'ml-1 text-sm font-normal text-muted',
  delta: 'mt-1.5 flex items-center gap-1 text-xs tabular-nums text-muted',
  none: 'mt-1.5 text-xs text-muted',
} as const;

function Delta({ t }: { t: Trend }) {
  if (t.prev === 0) return <p className={STYLES.none}>지난주 기록 없음</p>;
  const up = t.delta > 0;
  const Icon = t.delta === 0 ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <p className={STYLES.delta}>
      <Icon size={13} />
      <span>
        {up ? '+' : ''}
        {t.delta.toLocaleString()}
      </span>
      {t.pct !== null && (
        <span>
          · {up ? '+' : ''}
          {t.pct}%
        </span>
      )}
    </p>
  );
}

export function WeekComparison({ data }: { data: WeekComparisonData }) {
  const cards = [
    { label: '섭취', t: data.calories, unit: 'kcal' },
    { label: '소모', t: data.caloriesBurned, unit: 'kcal' },
    { label: '순 칼로리', t: data.net, unit: 'kcal' },
    { label: '기록', t: data.count, unit: '건' },
  ];
  return (
    <div className={STYLES.grid}>
      {cards.map((c) => (
        <div key={c.label} className={STYLES.card}>
          <p className={STYLES.label}>{c.label}</p>
          <p className={STYLES.value}>
            {c.t.value.toLocaleString()}
            <span className={STYLES.unit}>{c.unit}</span>
          </p>
          <Delta t={c.t} />
        </div>
      ))}
    </div>
  );
}
