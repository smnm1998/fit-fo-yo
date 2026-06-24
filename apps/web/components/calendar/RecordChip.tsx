'use client';

import * as Popover from '@radix-ui/react-popover';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { deleteRecord, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
};

const STYLES = {
  chip: 'pointer-events-auto block w-full truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight',
  diet: 'bg-emerald-100 text-emerald-800',
  exercise: 'bg-sky-100 text-sky-800',
  content:
    'z-50 flex w-64 flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg origin-[var(--radix-popover-content-transform-origin)] data-[state=open]:animate-[popIn_120ms_ease-out]',
  arrow: 'fill-surface',
  head: 'flex items-center gap-1.5',
  dot: 'h-2.5 w-2.5 shrink-0 rounded-full',
  dotDiet: 'bg-emerald-500',
  dotExercise: 'bg-sky-500',
  title: 'flex-1 truncate text-sm font-semibold text-foreground',
  itemRow: 'flex items-center justify-between gap-2 text-xs',
  itemName: 'truncate text-foreground',
  itemMetric: 'shrink-0 tabular-nums text-muted',
  actions: 'mt-1 flex justify-end',
  del: 'flex items-center gap-1 text-xs text-muted transition-colors hover:text-danger',
} as const;

function chipLabel(r: RecordDto): string {
  const items = r.type === 'DIET' ? r.dietItems : r.exerciseItems;
  return items.map((it) => it.name).join(', ') || (r.type === 'DIET' ? '식단' : '운동');
}

export function RecordChip({ record }: { record: RecordDto }) {
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const restoreRecord = useRecordsStore((s) => s.restoreRecord);
  const setNotice = useRecordsStore((s) => s.setNotice);
  const isDiet = record.type === 'DIET';

  async function onDelete() {
    removeRecord(record.id);
    try {
      await deleteRecord(record.id);
    } catch (err) {
      restoreRecord(record);
      setNotice(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={cn(STYLES.chip, isDiet ? STYLES.diet : STYLES.exercise)}>
          {chipLabel(record)}
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
            <span className={cn(STYLES.dot, isDiet ? STYLES.dotDiet : STYLES.dotExercise)} />
            <span className={STYLES.title}>{chipLabel(record)}</span>
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
          <div className={STYLES.actions}>
            <button type="button" onClick={() => void onDelete()} className={STYLES.del}>
              <Trash2 size={14} /> 삭제
            </button>
          </div>
          <Popover.Arrow className={STYLES.arrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
