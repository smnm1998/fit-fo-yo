'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { updateRecord, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { useDeleteRecord } from '@/lib/hooks/useDeleteRecord';
import type { RecordDto } from '@/lib/types';
import {
  buildRemove,
  buildReplace,
  itemCount,
  toEditItem,
  type EditItem,
} from './record-info-utils';
import { DeleteConfirm } from '@/components/ui/DeleteConfirm';

// 끼니 선택 (빈 값 = 기타)
const MEAL_SELECT = [
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
  { value: '', label: '기타' },
];

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

  // 편집: 채움 필드(밑줄 아님), 구분선 없음
  editWrap: 'flex w-full flex-col gap-2.5',
  editRow: 'flex items-center gap-2',
  editActions: 'ml-auto flex shrink-0 items-center gap-0.5',
  uName:
    'min-w-0 flex-1 rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-accent/20',
  uSelect:
    'shrink-0 rounded-lg bg-subtle px-2.5 py-1.5 text-xs text-muted outline-none transition focus:ring-2 focus:ring-accent/20',
  uNum: 'w-16 rounded-lg bg-subtle px-2.5 py-1.5 text-right text-sm tabular-nums text-foreground outline-none transition focus:ring-2 focus:ring-accent/20',
  unit: 'text-xs text-muted',
  err: 'mt-1 text-[11px] text-danger',
  desc: 'text-xs leading-relaxed text-muted',
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
      void deleteOne(record);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRecord(record.id, buildRemove(record, index));
      storeUpdate(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
      setMode('view');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={STYLES.card}>
      {mode === 'edit' && draft ? (
        <div className={STYLES.editWrap}>
          {/* 1행: 이름 + (식단이면) 끼니 */}
          <div className={STYLES.editRow}>
            <input
              className={STYLES.uName}
              value={draft.name}
              onChange={(e) => patch('name', e.target.value)}
              placeholder={isDiet ? '비빔밥' : '러닝'}
            />
            {isDiet && (
              <select
                className={STYLES.uSelect}
                value={draft.mealType}
                onChange={(e) => patch('mealType', e.target.value)}
              >
                {MEAL_SELECT.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2행: 칼로리(운동은 시간+칼로리) + 확인/취소 */}
          <div className={STYLES.editRow}>
            {isDiet ? (
              <>
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

            <div className={STYLES.editActions}>
              <button
                type="button"
                className={STYLES.iconBtn}
                onClick={() => void save()}
                disabled={busy}
                aria-label="확인"
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
            </div>
          </div>

          {error && <p className={STYLES.err}>{error}</p>}
        </div>
      ) : (
        <>
          <div className={STYLES.left}>
            <span className={STYLES.name}>{item.name}</span>
            <div className={STYLES.metaRow}>
              {!isDiet && eItem?.durationMinutes != null && (
                <span className={STYLES.sub}>{eItem.durationMinutes}분</span>
              )}
              {isDiet && typeof dItem?.grams === 'number' && (
                <span className={STYLES.sub}>약 {dItem.grams}g</span>
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
            {error && <p className={STYLES.err}>{error}</p>}
          </div>

          {mode === 'view' && (
            <div className={STYLES.actions}>
              <button
                type="button"
                className={STYLES.iconBtn}
                onClick={startEdit}
                aria-label="수정"
              >
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
            </div>
          )}
        </>
      )}
      {mode === 'confirm' && (
        <DeleteConfirm
          onCancel={() => setMode('view')}
          onConfirm={() => void doDelete()}
          busy={busy}
        />
      )}
    </div>
  );
}
