import { todayLabelLong } from '@/lib/date';

const STYLES = {
  wrap: 'flex flex-col gap-1',
  title: 'text-2xl font-bold text-foreground',
  date: 'text-sm text-muted',
} as const;

export function DashboardHeader({ nickname }: { nickname?: string | null }) {
  const name = nickname?.trim();
  return (
    <header className={STYLES.wrap}>
      <h1 className={STYLES.title}>
        {name ? `${name}님, 반갑습니다!` : '반갑습니다!'} <span aria-hidden>👋</span>
      </h1>
      <p className={STYLES.date}>{todayLabelLong()}</p>
    </header>
  );
}
