'use client';

import { useMemo } from 'react';
import { dayKeyKST, monthGridKST, todayKST } from '@/lib/date';
import type { RecordDto } from '@/lib/types';
import { DayCell } from './DayCell';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const EMPTY: RecordDto[] = [];

const STYLES = {
  wrap: 'overflow-hidden rounded-lg border border-border',
  weekRow: 'grid grid-cols-7 border-b border-border bg-surface',
  weekday: 'py-2 text-center text-xs font-medium text-muted',
  grid: 'grid grid-cols-7 gap-px bg-border',
} as const;

type CalendarGridProps = {
  month: string;
  records: RecordDto[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function CalendarGrid({ month, records, selectedDate, onSelect }: CalendarGridProps) {
  const days = useMemo(() => monthGridKST(month), [month]);
  const today = todayKST();

  // 날짜별 기록 배열(시간순)
  const byDay = useMemo(() => {
    const map = new Map<string, RecordDto[]>();
    for (const r of records) {
      const key = dayKeyKST(r.recordedAt);
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
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
        {days.map((date) => (
          <DayCell
            key={date}
            date={date}
            inMonth={date.slice(0, 7) === month}
            isToday={date === today}
            isSelected={date === selectedDate}
            records={byDay.get(date) ?? EMPTY}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
