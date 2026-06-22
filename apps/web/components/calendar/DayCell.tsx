'use client';

import { cn } from '@/lib/cn';

const STYLES = {
  base: 'flex aspect-square flex-col items-center gap-1 rounded-lg p-1.5 text-sm',
  filler: 'text-muted/40', // 이번 달 아닌 칸
  button: 'transition-colors hover:bg-subtle',
  num: 'flex h-6 w-6 items-center justify-center rounded-full',
  today: 'bg-subtle font-semibold text-foreground', // 오늘 = 회색 원
  selected: 'bg-foreground font-semibold text-background', // 선택 = 검은 원
  dots: 'flex h-1.5 gap-1', // 높이 고정 → 점 유무와 무관하게 숫자 정렬 유지
  dot: 'h-1.5 w-1.5 rounded-full',
  dietDot: 'bg-emerald-500',
  exerciseDot: 'bg-sky-500',
} as const;

type DayCellProps = {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasDiet: boolean;
  hasExercise: boolean;
  onSelect: (date: string) => void;
};

export function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  hasDiet,
  hasExercise,
  onSelect,
}: DayCellProps) {
  const day = Number(date.slice(8, 10));

  // 앞뒤 채움 칸
  if (!inMonth) {
    return (
      <div className={cn(STYLES.base, STYLES.filler)} aria-hidden>
        <span className={STYLES.num}>{day}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={cn(STYLES.base, STYLES.button)}
      aria-pressed={isSelected}
      aria-label={`${date}${hasDiet ? ', 식단 기록 있음' : ''}${hasExercise ? ', 운동 기록 있음' : ''}`}
    >
      <span
        className={cn(
          STYLES.num,
          isToday && !isSelected && STYLES.today,
          isSelected && STYLES.selected,
        )}
      >
        {day}
      </span>
      <span className={STYLES.dots}>
        {hasDiet && <span className={cn(STYLES.dot, STYLES.dietDot)}></span>}
        {hasExercise && <span className={cn(STYLES.dot, STYLES.exerciseDot)} />}
      </span>
    </button>
  );
}
