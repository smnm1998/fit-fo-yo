import { todayLabelLong } from '@/lib/date';
import type { Streak } from '@/lib/records';
import { StreakDots } from './StreakDots';

const STYLES = {
  wrap: 'flex flex-wrap items-center justify-between gap-4',
  greet: 'flex flex-col gap-1',
  title: 'text-2xl font-bold text-foreground',
  date: 'text-sm text-muted',
} as const;

export function DashboardHeader({
  nickname,
  streak,
}: {
  nickname?: string | null;
  streak: Streak;
}) {
  const name = nickname?.trim();
  return (
    <header className={STYLES.wrap}>
      <div className={STYLES.greet}>
        <h1 className={STYLES.title}>
          {name ? `${name}님, 반갑습니다` : '반갑습니다'} <span aria-hidden>👋</span>
        </h1>
        <p className={STYLES.date}>{todayLabelLong()}</p>
      </div>
      <StreakDots streak={streak} />
    </header>
  );
}
