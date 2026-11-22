import { cn } from '@/lib/cn';
import type { Streak } from '@/lib/records';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const STYLES = {
  wrap: 'hidden flex-col items-end gap-1.5 md:flex',
  row: 'inline-flex items-end gap-2.5',
  days: 'flex gap-2',
  day: 'flex w-4 flex-col items-center gap-1.5',
  pip: 'h-3.5 w-3.5 rounded-full border-2 border-border',
  today: 'ring-0',
  count: 'text-lg font-extrabold leading-none text-foreground',
  note: 'text-[11px] leading-none text-muted',
  dow: 'hidden text-[10px] font-semibold leading-none text-muted md:block',
  dowSun: 'text-danger/70',
  dowToday: 'text-foreground',
  on: 'border-emerald-500 bg-emerald-500',
} as const;

export function StreakDots({ streak, todayIndex }: { streak: Streak; todayIndex: number }) {
  return (
    <div className={STYLES.wrap} aria-label={`이번 주 ${streak.count}일 기록`}>
      <div className={STYLES.row}>
        <span className={STYLES.days}>
          {streak.marks.map((on, i) => (
            <span key={WEEKDAYS[i]} className={STYLES.day}>
              <span
                className={cn(
                  STYLES.dow,
                  i === 0 && STYLES.dowSun,
                  i === todayIndex && STYLES.dowToday,
                )}
              >
                {WEEKDAYS[i]}
              </span>
              <span className={cn(STYLES.pip, on && STYLES.on, i === todayIndex && STYLES.today)} />
            </span>
          ))}
        </span>
        <span className={STYLES.count}>{streak.count}일</span>
      </div>
      <p className={STYLES.note}>오늘 기록을 남겨야 출석으로 인정돼요</p>
    </div>
  );
}
