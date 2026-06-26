'use client';

import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';
import { dateLabel, dayNoonIsoKST } from '@/lib/date';
import { ManualRecordForm } from '@/components/calendar/ManualRecordForm';
import { RecordChip } from './RecordChip';
import type { RecordDto } from '@/lib/types';

const MAX_LINES = 3;

const STYLES = {
  cell: 'relative flex min-h-[6.5rem] flex-col gap-1 bg-surface p-1.5',
  today: 'bg-subtle',
  filler: 'relative flex min-h-[6.5rem] flex-col gap-1 bg-surface p-1.5 text-muted/40',
  addTrigger: 'absolute inset-0 transition-colors hover:bg-subtle',
  inner: 'pointer-events-none relative z-10 flex flex-col gap-1',
  num: 'flex h-6 w-6 items-center justify-center rounded-full text-xs',
  numToday: 'font-semibold text-foreground',
  numSelected: 'bg-accent font-semibold text-surface',
  lines: 'flex min-w-0 flex-col gap-0.5',
  more: 'text-[11px] leading-tight text-muted',
  content:
    'z-50 flex max-h-[80vh] w-80 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-lg origin-[var(--radix-popover-content-transform-origin)] data-[state=open]:animate-[popIn_120ms_ease-out]',
  arrow: 'fill-surface',
} as const;

type DayCellProps = {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  records: RecordDto[];
  onSelect: (date: string) => void;
};

export function DayCell({ date, inMonth, isToday, isSelected, records, onSelect }: DayCellProps) {
  const day = Number(date.slice(8, 10));

  if (!inMonth) {
    return (
      <div className={STYLES.filler} aria-hidden>
        <span className={STYLES.num}>{day}</span>
      </div>
    );
  }

  const shown = records.slice(0, MAX_LINES);
  const extra = records.length - shown.length;

  return (
    <div className={cn(STYLES.cell, isToday && STYLES.today)}>
      {/* 빈 칸/숫자 클릭 → 등록 팝오버 */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            onClick={() => onSelect(date)}
            className={STYLES.addTrigger}
            aria-label={`${date} 기록 추가`}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="right"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className={STYLES.content}
          >
            <ManualRecordForm recordedAt={dayNoonIsoKST(date)} dateText={dateLabel(date)} />
            <Popover.Arrow className={STYLES.arrow} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* 숫자 + 칩(각 요소 = 자기 팝오버) */}
      <div className={STYLES.inner}>
        <span
          className={cn(
            STYLES.num,
            isToday && !isSelected && STYLES.numToday,
            isSelected && STYLES.numSelected,
          )}
        >
          {day}
        </span>
        <div className={STYLES.lines}>
          {shown.map((r) => (
            <RecordChip key={r.id} record={r} />
          ))}
          {extra > 0 && <span className={STYLES.more}>+{extra}</span>}
        </div>
      </div>
    </div>
  );
}
