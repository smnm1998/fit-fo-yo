'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RECORD_TYPE_META, MEAL_LABEL, recordName } from '@/lib/record-meta';
import { useDeleteRecord } from '@/lib/hooks/useDeleteRecord';
import { DeleteConfirm } from '@/components/ui/DeleteConfirm';

import type { RecordDto } from '@/lib/types';
import { POPOVER_SURFACE } from '@/components/ui/surface';

const STYLES = {
  chip: 'pointer-events-auto block w-full truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-colors',
  content: `relative z-50 flex max-h-[70vh] w-64 flex-col gap-2 overflow-y-auto p-3 ${POPOVER_SURFACE}`,
  arrow: 'fill-surface',
  head: 'flex items-center gap-1.5',
  dot: 'h-2.5 w-2.5 shrink-0 rounded-full',
  title: 'flex-1 truncate text-sm font-semibold text-foreground',
  del: 'shrink-0 text-muted transition-colors hover:text-danger',
  itemRow: 'flex items-center justify-between gap-2 text-xs',
  itemName: 'truncate text-foreground',
  itemMetric: 'shrink-0 tabular-nums text-muted',
} as const;

export function RecordChip({ record }: { record: RecordDto }) {
  const [confirming, setConfirming] = useState(false);
  const deleteOne = useDeleteRecord();
  const meta = RECORD_TYPE_META[record.type];
  const isDiet = record.type === 'DIET';

  return (
    <Popover.Root onOpenChange={(open) => !open && setConfirming(false)}>
      <Popover.Trigger asChild>
        <button type="button" className={cn(STYLES.chip, meta.chip)}>
          {recordName(record)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className={STYLES.content}
        >
          <div className={STYLES.head}>
            <span className={cn(STYLES.dot, meta.dot)} />
            <span className={STYLES.title}>{recordName(record)}</span>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={STYLES.del}
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {isDiet
            ? record.dietItems.map((it) => (
                <div key={it.id} className={STYLES.itemRow}>
                  <span className={STYLES.itemName}>
                    {it.name}
                    {it.mealType ? ` · ${MEAL_LABEL[it.mealType] ?? it.mealType}` : ''}
                  </span>
                  {typeof it.calories === 'number' && (
                    <span className={STYLES.itemMetric}>{it.calories} kcal</span>
                  )}
                </div>
              ))
            : record.exerciseItems.map((it) => (
                <div key={it.id} className={STYLES.itemRow}>
                  <span className={STYLES.itemName}>
                    {it.name}
                    {it.durationMinutes ? ` · ${it.durationMinutes}분` : ''}
                  </span>
                  {typeof it.caloriesBurned === 'number' && (
                    <span className={STYLES.itemMetric}>{it.caloriesBurned} kcal</span>
                  )}
                </div>
              ))}

          <Popover.Arrow className={STYLES.arrow} />

          {confirming && (
            <DeleteConfirm
              onCancel={() => setConfirming(false)}
              onConfirm={() => {
                void deleteOne(record);
                setConfirming(false);
              }}
            />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
