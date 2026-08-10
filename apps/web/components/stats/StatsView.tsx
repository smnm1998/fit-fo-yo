'use client';

import dynamic from 'next/dynamic';
import type { DayPoint, MealSlice } from '@/lib/records';
import { MealDistribution } from './MealDistribution';

const STYLES = {
  wrap: 'grid gap-5 sm:grid-cols-[1.5fr_1fr]',
  card: 'rounded-lg border border-border bg-surface p-5',
  title: 'mb-1 text-sm font-medium text-foreground',
  sub: 'mb-4 text-xs text-muted',
  skeleton: 'h-[240px] animate-pulse rounded-lg bg-subtle',
} as const;

const WeeklyTrendChart = dynamic(
  () => import('./WeeklyTrendChart').then((m) => m.WeeklyTrendChart),
  { ssr: false, loading: () => <div className={STYLES.skeleton} /> },
);

export function StatsView({ daily, meals }: { daily: DayPoint[]; meals: MealSlice[] }) {
  return (
    <div className={STYLES.wrap}>
      <section className={STYLES.card}>
        <h2 className={STYLES.title}>주간 칼로리 추이</h2>
        <p className={STYLES.sub}>선택한 주의 일별 섭취·소모</p>
        <WeeklyTrendChart data={daily} />
      </section>
      <section className={STYLES.card}>
        <h2 className={STYLES.title}>끼니별 분포</h2>
        <p className={STYLES.sub}>섭취 칼로리를 끼니로 나눔</p>
        <MealDistribution meals={meals} />
      </section>
    </div>
  );
}
