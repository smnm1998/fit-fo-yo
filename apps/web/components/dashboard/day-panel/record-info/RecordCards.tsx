'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MEAL_OPTIONS } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';
import type { Draft, EditItem } from './record-info-utils';

const STYLES = {
  cardView: 'flex flex-col gap-2 rounded-xl border border-border p-3',
  cardEdit: 'flex gap-2 rounded-xl border border-border p-3',
  itemsCol: 'flex min-w-0 flex-1 flex-col gap-2',
  itemRow: 'flex flex-col gap-0.5',
  name: 'break-words text-base font-semibold text-foreground',
  metaRow: 'flex items-center gap-1.5',
  kcal: 'text-sm font-semibold tabular-nums text-foreground',
  sub: 'text-xs text-muted',
  estBadge:
    'rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  editRow: 'flex items-center gap-2',
  uName:
    'min-w-0 flex-1 rounded-none border-0 border-b border-border bg-transparent py-1 text-base font-semibold text-foreground outline-none focus:border-accent',
  uSelect:
    'shrink-0 rounded-none border-0 border-b border-border bg-transparent py-1 text-xs text-muted outline-none focus:border-accent',
  uNum: 'w-16 shrink-0 rounded-none border-0 border-b border-border bg-transparent py-1 text-right text-sm text-foreground outline-none focus:border-accent',
  unit: 'text-xs text-muted',
  delBtn:
    'mt-0.5 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-danger',
  confirmStrip: 'flex items-center justify-between gap-2 rounded-lg bg-danger/5 px-2 py-1.5',
  confirmMsg: 'text-xs font-medium text-danger',
} as const;

export function RecordViewCard({ record }: { record: RecordDto }) {
  return (
    <div className={STYLES.cardView}>
      {record.type === 'DIET'
        ? record.dietItems.map((it) => (
            <div key={it.id} className={STYLES.itemRow}>
              <span className={STYLES.name}>{it.name}</span>
              <div className={STYLES.metaRow}>
                {typeof it.calories === 'number' && (
                  <span className={STYLES.kcal}>{it.calories} kcal</span>
                )}
                {it.estimated && <span className={STYLES.estBadge}>추정</span>}
              </div>
            </div>
          ))
        : record.exerciseItems.map((it) => (
            <div key={it.id} className={STYLES.itemRow}>
              <span className={STYLES.name}>{it.name}</span>
              <div className={STYLES.metaRow}>
                {it.durationMinutes != null && (
                  <span className={STYLES.sub}>{it.durationMinutes}분</span>
                )}
                {typeof it.caloriesBurned === 'number' && (
                  <span className={STYLES.kcal}>{it.caloriesBurned} kcal</span>
                )}
                {it.estimated && <span className={STYLES.estBadge}>추정</span>}
              </div>
            </div>
          ))}
    </div>
  );
}

export function RecordEditCard({
  draft,
  confirming,
  onPatch,
  onArm,
  onCancelConfirm,
  onDelete,
}: {
  draft: Draft;
  confirming: boolean;
  onPatch: (i: number, key: keyof EditItem, value: string) => void;
  onArm: () => void;
  onCancelConfirm: () => void;
  onDelete: () => void;
}) {
  const isDiet = draft.record.type === 'DIET';
  return (
    <div className={STYLES.cardEdit}>
      <div className={STYLES.itemsCol}>
        {draft.items.map((it, i) => (
          <div key={i} className={STYLES.editRow}>
            <input
              className={STYLES.uName}
              value={it.name}
              onChange={(e) => onPatch(i, 'name', e.target.value)}
              placeholder={isDiet ? '비빔밥' : '러닝'}
            />
            {isDiet ? (
              <>
                <select
                  className={STYLES.uSelect}
                  value={it.mealType}
                  onChange={(e) => onPatch(i, 'mealType', e.target.value)}
                >
                  {MEAL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  className={STYLES.uNum}
                  value={it.calories}
                  onChange={(e) => onPatch(i, 'calories', e.target.value)}
                  placeholder="0"
                />
                <span className={STYLES.unit}>kcal</span>
              </>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  className={STYLES.uNum}
                  value={it.durationMinutes}
                  onChange={(e) => onPatch(i, 'durationMinutes', e.target.value)}
                  placeholder="0"
                />
                <span className={STYLES.unit}>분</span>
                <input
                  type="number"
                  min={0}
                  className={STYLES.uNum}
                  value={it.caloriesBurned}
                  onChange={(e) => onPatch(i, 'caloriesBurned', e.target.value)}
                  placeholder="0"
                />
                <span className={STYLES.unit}>kcal</span>
              </>
            )}
          </div>
        ))}

        {confirming && (
          <div className={STYLES.confirmStrip}>
            <span className={STYLES.confirmMsg}>진짜 삭제하시겠습니까?</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onCancelConfirm}>
                취소
              </Button>
              <Button variant="danger" size="sm" onClick={onDelete}>
                삭제
              </Button>
            </div>
          </div>
        )}
      </div>

      {!confirming && (
        <button type="button" className={STYLES.delBtn} onClick={onArm} aria-label="삭제">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
