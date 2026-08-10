import type { MealSlice } from '@/lib/records';

const ETC_META = { label: '기타', color: '#a7f3d0' };

const MEAL_META: Record<string, { label: string; color: string }> = {
  BREAKFAST: { label: '아침', color: '#6ee7b7' },
  LUNCH: { label: '점심', color: '#34d399' },
  DINNER: { label: '저녁', color: '#10b981' },
  SNACK: { label: '간식', color: '#059669' },
  ETC: ETC_META,
};

const STYLES = {
  empty: 'py-12 text-center text-sm text-muted',
  bar: 'flex h-7 rounded-lg bg-subtle',
  seg: 'group relative h-full first:rounded-l-lg last:rounded-r-lg',
  tip: 'pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100',
  legend: 'mt-4 flex flex-col gap-2.5',
  row: 'flex items-center gap-2.5 text-sm',
  sw: 'h-2.5 w-2.5 shrink-0 rounded-[3px]',
  name: 'text-foreground',
  kc: 'ml-auto font-semibold tabular-nums text-foreground',
  pct: 'w-11 text-right tabular-nums text-muted',
} as const;

export function MealDistribution({ meals }: { meals: MealSlice[] }) {
  const total = meals.reduce((s, m) => s + m.calories, 0);
  if (total === 0) return <p className={STYLES.empty}>아직 식단 데이터가 없어요.</p>;

  return (
    <div>
      <div className={STYLES.bar}>
        {meals.map((m) => {
          const meta = MEAL_META[m.meal] ?? ETC_META;
          const pct = Math.round((m.calories / total) * 100);
          return (
            <div
              key={m.meal}
              className={STYLES.seg}
              style={{ width: `${(m.calories / total) * 100}%`, background: meta.color }}
            >
              <span className={STYLES.tip}>
                {meta.label} · {m.calories.toLocaleString()}kcal · {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <div className={STYLES.legend}>
        {meals.map((m) => {
          const meta = MEAL_META[m.meal] ?? ETC_META;
          return (
            <div key={m.meal} className={STYLES.row}>
              <span className={STYLES.sw} style={{ background: meta.color }} />
              <span className={STYLES.name}>{meta.label}</span>
              <span className={STYLES.kc}>{m.calories.toLocaleString()}</span>
              <span className={STYLES.pct}>{Math.round((m.calories / total) * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
