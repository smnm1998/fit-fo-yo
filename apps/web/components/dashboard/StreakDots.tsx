import { cn } from '@/lib/cn';
import type { Streak } from '@/lib/records';
import Image from 'next/image';

const STYLES = {
  wrap: 'flex flex-col items-end gap-1',
  row: 'inline-flex items-center gap-3',
  dots: 'flex gap-2',
  pip: 'h-3.5 w-3.5 rounded-full border-2 border-border',
  on: 'border-emerald-500 bg-emerald-500',
  count: 'text-lg font-extrabold text-foreground',
  note: 'text-[11px] leading-none text-muted',
} as const;

export function StreakDots({ streak }: { streak: Streak }) {
  return (
    <div className={STYLES.wrap} aria-label={`이번 주 ${streak.count}일 기록`}>
      <div className={STYLES.row}>
        <span className={STYLES.dots}>
          {streak.marks.map((on, i) => (
            <span key={i} className={cn(STYLES.pip, on && STYLES.on)} />
          ))}
        </span>
        <span className={STYLES.count}>
          {streak.count}일
          {streak.count > 0 && (
            <Image
              src="/Fire.png"
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="ml-1 inline-block align-[-3px] animate-[flicker_1.8s_ease-in-out_infinite]"
            />
          )}
        </span>
      </div>
      <p className={STYLES.note}>오늘 기록을 남겨야 출석으로 인정돼요</p>
    </div>
  );
}
