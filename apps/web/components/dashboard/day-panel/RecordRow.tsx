'use client';

import { cn } from '@/lib/cn';
import { RECORD_TYPE_META } from '@/lib/record-meta';
import type { DayEntry } from './day-entries';

const STYLES = {
  row: 'flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-subtle',
  dot: 'h-2 w-2 shrink-0 rounded-full',
  info: 'flex min-w-0 flex-1 flex-col',
  tag: 'text-[10px] font-bold leading-tight text-muted',
  name: 'truncate text-sm font-semibold text-foreground',
  right: 'flex shrink-0 items-center gap-1.5',
  est: 'rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  kcal: 'text-xs font-bold tabular-nums',
} as const;

export function RecordRow({ entry, onOpen }: { entry: DayEntry; onOpen: () => void }) {
  const meta = RECORD_TYPE_META[entry.kind];

  return (
    <button type="button" onClick={onOpen} className={STYLES.row}>
      <span className={cn(STYLES.dot, meta.dot)} />
      <span className={STYLES.info}>
        <span className={STYLES.tag}>{entry.tag}</span>
        <span className={STYLES.name}>{entry.name}</span>
      </span>
      <span className={STYLES.right}>
        {entry.estimated && <span className={STYLES.est}>추정</span>}
        {entry.kcal > 0 && (
          <span className={cn(STYLES.kcal, meta.value)}>
            {entry.kind === 'EXERCISE' && '−'}
            {entry.kcal.toLocaleString()}
          </span>
        )}
      </span>
    </button>
  );
}
