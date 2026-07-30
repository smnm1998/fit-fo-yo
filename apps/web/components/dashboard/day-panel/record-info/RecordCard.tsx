'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { MEAL_OPTIONS } from '@/lib/record-meta';
import { updateRecord, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { useDeleteRecord } from '@/lib/hooks/useDeleteRecord';
import { Button } from '@/components/ui/Button';
import type { RecordDto } from '@/lib/types';
import {
  buildRemove,
  buildReplace,
  itemCount,
  toEditItem,
  type EditItem,
} from './record-info-utils';

const STYLES = {
  card: 'relative flex items-start justify-between gap-2 rounded-xl border border-border p-3',
  left: 'flex min-w-0 flex-1 flex-col gap-0.5',
  name: 'break-words text-base font-semibold text-foreground',
  metaRow: 'flex items-center gap-1.5',
  kcal: 'text-sm font-semibold tabular-nums text-foreground',
  sub: 'text-xs text-muted',
  estBadge:
    'rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  actions: 'flex shrink-0 items-center gap-0.5',
  iconBtn:
    'rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-foreground disabled:opacity-40',
  iconDanger: 'rounded-md p-1 text-muted transition-colors hover:bg-subtle hover:text-danger',
  uName:
    'w-full rounded-none border-0 border-b border-border bg-transparent py-1 text-base font-semibold text-foreground outline-none focus:border-accent',
  uSelect:
    'shrink-0 rounded-none border-0 border-b border-border bg-transparent py-1 text-xs text-muted outline-none focus:border-accent',
  uNum: 'w-14 shrink-0 rounded-none border-0 border-b border-border bg-transparent py-1 text-right text-sm text-foreground outline-none focus:border-accent',
  unit: 'text-xs text-muted',
  confirmOverlay:
    'absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-surface/60 backdrop-blur-sm',
  confirmMsg: 'text-sm font-medium text-foreground',
  err: 'mt-1 text-[11px] text-danger',
} as const;

export function RecordCard({ record, index }: { record: RecordDto; index: number }) {
  const isDiet = record.type === 'DIET';
  const dItem = record.dietItems[index];
  const eItem = record.exerciseItems[index];
  const item = isDiet ? dItem : eItem;

  const storeUpdate = useRecordsStore((s) => s.updateRecord);
  const deleteOne = useDeleteRecord();
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm'>('view');
  const [draft, setDraft] = useState<EditItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  function startEdit() {
    setDraft(toEditItem(record, index));
    setError(null);
    setMode('edit');
  }
  function patch(key: keyof EditItem, value: string) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }
  async function save() {
    if (!draft || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRecord(record.id, buildReplace(record, index, draft));
      storeUpdate(updated);
      setMode('view');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '수정에 실패했어요.');
    } finally {
      setBusy(false);
    }
  }
  async function doDelete() {
    if (busy) return;
    if (itemCount(record) <= 1) {
      void deleteOne(record); // 마지막 아이템 → 레코드 삭제 (낙관적, 카드 언마운트)
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRecord(record.id, buildRemove(record, index));
      storeUpdate(updated); // 아이템 하나만 제거
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
      setMode('view');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={STYLES.card}>
      <div className={STYLES.left}>
        {mode === 'edit' && draft ? (
          <>
            {/* 이름 슬롯 (view의 name 자리) */}
            <input
              className={STYLES.uName}
              value={draft.name}
              onChange={(e) => patch('name', e.target.value)}
              placeholder={isDiet ? '비빔밥' : '러닝'}
            />
            {/* 메타 슬롯 (view의 칼로리 자리) */}
            <div className={STYLES.metaRow}>
              {isDiet ? (
                <>
                  <select
                    className={STYLES.uSelect}
                    value={draft.mealType}
                    onChange={(e) => patch('mealType', e.target.value)}
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
                    value={draft.calories}
                    onChange={(e) => patch('calories', e.target.value)}
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
                    value={draft.durationMinutes}
                    onChange={(e) => patch('durationMinutes', e.target.value)}
                    placeholder="0"
                  />
                  <span className={STYLES.unit}>분</span>
                  <input
                    type="number"
                    min={0}
                    className={STYLES.uNum}
                    value={draft.caloriesBurned}
                    onChange={(e) => patch('caloriesBurned', e.target.value)}
                    placeholder="0"
                  />
                  <span className={STYLES.unit}>kcal</span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <span className={STYLES.name}>{item.name}</span>
            <div className={STYLES.metaRow}>
              {!isDiet && eItem?.durationMinutes != null && (
                <span className={STYLES.sub}>{eItem.durationMinutes}분</span>
              )}
              {isDiet
                ? typeof dItem?.calories === 'number' && (
                    <span className={STYLES.kcal}>{dItem.calories} kcal</span>
                  )
                : typeof eItem?.caloriesBurned === 'number' && (
                    <span className={STYLES.kcal}>{eItem.caloriesBurned} kcal</span>
                  )}
              {item.estimated && <span className={STYLES.estBadge}>추정</span>}
            </div>
          </>
        )}
        {error && <p className={STYLES.err}>{error}</p>}
      </div>

      <div className={STYLES.actions}>
        {mode === 'view' && (
          <>
            <button type="button" className={STYLES.iconBtn} onClick={startEdit} aria-label="수정">
              <Pencil size={15} />
            </button>
            <button
              type="button"
              className={STYLES.iconDanger}
              onClick={() => setMode('confirm')}
              aria-label="삭제"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
        {mode === 'edit' && (
          <>
            <button
              type="button"
              className={STYLES.iconBtn}
              onClick={() => void save()}
              disabled={busy}
              aria-label="저장"
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              className={STYLES.iconBtn}
              onClick={() => setMode('view')}
              disabled={busy}
              aria-label="취소"
            >
              <X size={15} />
            </button>
          </>
        )}
      </div>

      {mode === 'confirm' && (
        <div className={STYLES.confirmOverlay}>
          <span className={STYLES.confirmMsg}>삭제할까요?</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setMode('view')} disabled={busy}>
              취소
            </Button>
            <Button variant="danger" size="sm" onClick={() => void doDelete()} disabled={busy}>
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
