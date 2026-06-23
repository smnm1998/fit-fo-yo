'use client';

import dynamic from 'next/dynamic';
import type { DayPoint } from '@/lib/records';

const STYLES = {
  wrap: 'flex flex-col gap-4',
  card: 'rounded-lg border border-border bg-surface p-5',
  title: 'mb-1 text-sm font-medium text-foreground',
  sub: 'mb-4 text-xs text-muted',
  skeleton: 'h-[240px] animate-pulse rounded-lg bg-subtle',
} as const;

function ChartSkeleton() {
  return <div className={STYLES.skeleton} />;
}

const WeeklyTrendChart = dynamic(
  () => import('./WeeklyTrendChart').then((m) => m.WeeklyTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const MacroChart = dynamic(() => import('./MacroChart').then((m) => m.MacroChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

type StatsViewProps = {
  daily: DayPoint[];
  macros: { carbs: number; protein: number; fat: number };
};

export function StatsView({ daily, macros }: StatsViewProps) {
  return (
    <div className={STYLES.wrap}>
      <section className={STYLES.card}>
        <h2 className={STYLES.title}>주간 칼로리 추이</h2>
        <p className={STYLES.sub}>최근 7일 섭취·소모</p>
        <WeeklyTrendChart data={daily} />
      </section>
      <section className={STYLES.card}>
        <h2 className={STYLES.title}>매크로 비율</h2>
        <p className={STYLES.sub}>최근 7일 탄·단·지 합계</p>
        <MacroChart carbs={macros.carbs} protein={macros.protein} fat={macros.fat} />
      </section>
    </div>
  );
}
