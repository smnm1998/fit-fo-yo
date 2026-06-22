'use client';

import { useMemo } from 'react';
import { dayKeyKST, monthGridKST, todayKST } from '@/lib/date';
import type { RecordDto } from '@/lib/types';
import { DayCell } from './DayCell';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const STYLES = {
  wrap: 'rounded-lg border border-border bg-surface p-4',
  weekRow: 'mb-1 grid grid-cols-7',
  weekday: 'py-1 text-center text-xs font-medium text-muted',
  grid: 'grid grid-cols-7 gap-0.5',
} as const;

type DayMarks = { diet: boolean; exercise: boolean };

type CalendarGridProps = {
  month: string;
  records: RecordDto[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function CalendarGrid({ month, records, selectedDate, onSelect }: CalendarGridProps) {
  const days = useMemo(() => monthGridKST(month), [month]);
  const today = todayKST();

  // 날짜별 기록 유무(식단/운동) 인덱스
  const marks = useMemo(() => {
    const map = new Map<string, DayMarks>();
    for (const r of records) {
      const key = dayKeyKST(r.recordedAt);
      const cur = map.get(key) ?? { diet: false, exercise: false };
      if (r.type === 'DIET') cur.diet = true;
      else cur.exercise = true;
      map.set(key, cur);
    }
    return map;
  }, [records]);

  return (
    <div className={STYLES.wrap}>
      <div className={STYLES.weekRow}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={STYLES.weekday}>
            {w}
          </div>
        ))}
      </div>
      <div className={STYLES.grid}>
        {days.map((date) => {
          const mark = marks.get(date);
          return (
            <DayCell
              key={date}
              date={date}
              inMonth={date.slice(0, 7) === month}
              isToday={date === today}
              isSelected={date === selectedDate}
              hasDiet={mark?.diet ?? false}
              hasExercise={mark?.exercise ?? false}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
