'use client';

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { dayKeyKST, monthGridKST, todayKST } from '@/lib/date';
import { RECORD_TYPE_META, recordName } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';
import { DayCell } from './DayCell';
import { useRecordDrag } from './useRecordDrag';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const EMPTY: RecordDto[] = [];

const STYLES = {
  wrap: 'overflow-hidden rounded-lg border border-border',
  weekRow: 'grid grid-cols-7 border-b border-border bg-surface',
  weekday: 'py-2 text-center text-xs font-medium text-muted',
  grid: 'grid grid-cols-7 gap-px bg-border',
  ghost:
    'pointer-events-none fixed left-0 top-0 z-[60] max-w-40 truncate rounded px-1.5 py-0.5 text-[11px] leading-tight shadow-lg',
} as const;

type CalendarGridProps = {
  month: string;
  records: RecordDto[];
  selectedDate: string;
  onSelect: (date: string) => void;
  onMoveRecord?: (record: RecordDto, toDay: string) => void;
};

export function CalendarGrid({
  month,
  records,
  selectedDate,
  onSelect,
  onMoveRecord,
}: CalendarGridProps) {
  const days = useMemo(() => monthGridKST(month), [month]);
  const today = todayKST();
  const { drag, ghostRef, ghostStyle, chip } = useRecordDrag((record, toDay) => {
    onMoveRecord?.(record, toDay);
  });
  const chipDrag = onMoveRecord ? chip : undefined;

  // 날짜별 기록 배열 (시간순)
  const byDay = useMemo(() => {
    const map = new Map<string, RecordDto[]>();

    for (const r of records) {
      const key = dayKeyKST(r.recordedAt);
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
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
        {days.map((date, i) => (
          <DayCell
            key={date}
            date={date}
            weekday={i % 7}
            inMonth={date.slice(0, 7) === month}
            isToday={date === today}
            isSelected={date === selectedDate}
            isDropTarget={drag !== null && date === drag.overDay && date !== drag.fromDay}
            records={byDay.get(date) ?? EMPTY}
            onSelect={onSelect}
            chipDrag={chipDrag}
          />
        ))}
      </div>

      {drag &&
        createPortal(
          <div
            ref={ghostRef}
            className={cn(STYLES.ghost, RECORD_TYPE_META[drag.record.type].chip)}
            style={ghostStyle}
          >
            {recordName(drag.record)}
          </div>,
          document.body,
        )}
    </div>
  );
}
