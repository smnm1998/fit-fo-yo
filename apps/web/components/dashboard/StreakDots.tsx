import { cn } from '@/lib/cn';
import type { Streak } from '@/lib/records';

const STYLES = {
  wrap: 'group relative inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/20',
  dots: 'flex gap-2',
  pip: 'h-3.5 w-3.5 rounded-full border-2 border-border',
  on: 'border-emerald-500 bg-emerald-500',
  count: 'text-lg font-extrabold text-foreground',
  tip: 'pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
} as const;

export function StreakDots({ streak }: { streak: Streak }) {
  return (
    <div className={STYLES.wrap} tabIndex={0} aria-label={`이번 주 ${streak.count}일 기록`}>
      <span className={STYLES.dots}>
        {streak.marks.map((on, i) => (
          <span key={i} className={cn(STYLES.pip, on && STYLES.on)} />
        ))}
      </span>
      <span className={STYLES.count}>
        {streak.count}일{streak.count > 0 && ' 🔥'}
      </span>
      <span className={STYLES.tip}>이번 주 기록 기준</span>
    </div>
  );
}
