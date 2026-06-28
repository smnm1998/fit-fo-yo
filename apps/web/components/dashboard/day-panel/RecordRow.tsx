'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RECORD_TYPE_META, recordMealLabel, recordName, recordTotalKcal } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';

const STYLES = {
  row: 'group relative flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 transition-colors',
  rowSelectable: 'w-full cursor-pointer text-left hover:border-danger/50',
  rowSelected: 'border-danger bg-danger/10',
  dot: 'h-2 w-2 shrink-0 rounded-full',
  name: 'min-w-0 flex-1 truncate text-sm text-foreground',
  meal: 'shrink-0 text-[11px] text-muted',
  metric: 'shrink-0 text-xs font-semibold tabular-nums text-foreground',
  checkOverlay:
    'absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-danger/15 text-danger',
  editOverlay:
    'absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100',
  editLabel: 'text-xs font-semibold text-foreground',
} as const;

type Props = {
  record: RecordDto;
  deleteMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function RecordRow({ record, deleteMode, selected, onToggle, onEdit }: Props) {
  const meta = RECORD_TYPE_META[record.type];
  const meal = recordMealLabel(record);
  const total = recordTotalKcal(record);

  const inner = (
    <>
      <span className={cn(STYLES.dot, meta.dot)} />
      <span className={STYLES.name}>{recordName(record)}</span>
      {meal && <span className={STYLES.meal}>{meal}</span>}
      {total > 0 && <span className={STYLES.metric}>{total.toLocaleString()} kcal</span>}
    </>
  );

  if (deleteMode) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(STYLES.row, STYLES.rowSelectable, selected && STYLES.rowSelected)}
      >
        {inner}
        {selected && (
          <span className={STYLES.checkOverlay}>
            <Check size={18} />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={STYLES.row}>
      {inner}
      <button type="button" onClick={onEdit} className={STYLES.editOverlay} aria-label="수정">
        <span className={STYLES.editLabel}>수정하기</span>
      </button>
    </div>
  );
}
