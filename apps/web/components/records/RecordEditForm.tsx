'use client';

import { useState, type FormEvent } from 'react';
import { updateRecord, ApiError, type UpdateRecordInput } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const MEALS = [
  { value: '', label: '식사 선택' },
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
];

type EditItem = {
  name: string;
  mealType: string;
  calories: string;
  durationMinutes: string;
  caloriesBurned: string;
};

const STYLES = {
  form: 'flex flex-col gap-3',
  item: 'flex flex-col gap-1.5 border-b border-border pb-2 last:border-0 last:pb-0',
  field: 'flex items-center gap-2',
  label: 'w-12 shrink-0 text-[11px] text-muted',
  input: 'w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted',
  actions: 'flex items-center justify-end gap-3 pt-1',
  err: 'text-[11px] text-danger',
} as const;

const toNum = (s: string) => (s.trim() !== '' ? Number(s) : undefined);

export function RecordEditForm({
  record,
  onSaved,
  onCancel,
}: {
  record: RecordDto;
  onSaved: (record: RecordDto) => void;
  onCancel: () => void;
}) {
  const isDiet = record.type === 'DIET';
  const storeUpdate = useRecordsStore((s) => s.updateRecord);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<EditItem[]>(() =>
    isDiet
      ? record.dietItems.map((it) => ({
          name: it.name,
          mealType: it.mealType ?? '',
          calories: it.calories != null ? String(it.calories) : '',
          durationMinutes: '',
          caloriesBurned: '',
        }))
      : record.exerciseItems.map((it) => ({
          name: it.name,
          mealType: '',
          calories: '',
          durationMinutes: it.durationMinutes != null ? String(it.durationMinutes) : '',
          caloriesBurned: it.caloriesBurned != null ? String(it.caloriesBurned) : '',
        })),
  );

  function patch(i: number, key: keyof EditItem, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    const input: UpdateRecordInput = isDiet
      ? {
          dietItems: items.map((it, i) => ({
            name: it.name.trim(),
            mealType: it.mealType || undefined,
            calories: toNum(it.calories),
            carbs: record.dietItems[i]?.carbs ?? undefined,
            protein: record.dietItems[i]?.protein ?? undefined,
            fat: record.dietItems[i]?.fat ?? undefined,
          })),
        }
      : {
          exerciseItems: items.map((it, i) => ({
            name: it.name.trim(),
            durationMinutes: toNum(it.durationMinutes),
            caloriesBurned: toNum(it.caloriesBurned),
            intensity: record.exerciseItems[i]?.intensity ?? undefined,
          })),
        };
    try {
      const updated = await updateRecord(record.id, input);
      storeUpdate(updated);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '수정에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={STYLES.form} onSubmit={onSubmit}>
      {items.map((it, i) => (
        <div key={i} className={STYLES.item}>
          <div className={STYLES.field}>
            <span className={STYLES.label}>이름</span>
            <input
              className={STYLES.input}
              value={it.name}
              onChange={(e) => patch(i, 'name', e.target.value)}
              placeholder={isDiet ? '비빔밥' : '러닝'}
            />
          </div>
          {isDiet ? (
            <>
              <div className={STYLES.field}>
                <span className={STYLES.label}>식사</span>
                <select
                  className={STYLES.input}
                  value={it.mealType}
                  onChange={(e) => patch(i, 'mealType', e.target.value)}
                >
                  {MEALS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={STYLES.field}>
                <span className={STYLES.label}>칼로리</span>
                <input
                  type="number"
                  min={0}
                  className={STYLES.input}
                  value={it.calories}
                  onChange={(e) => patch(i, 'calories', e.target.value)}
                  placeholder="kcal"
                />
              </div>
            </>
          ) : (
            <>
              <div className={STYLES.field}>
                <span className={STYLES.label}>시간</span>
                <input
                  type="number"
                  min={0}
                  className={STYLES.input}
                  value={it.durationMinutes}
                  onChange={(e) => patch(i, 'durationMinutes', e.target.value)}
                  placeholder="분"
                />
              </div>
              <div className={STYLES.field}>
                <span className={STYLES.label}>소모</span>
                <input
                  type="number"
                  min={0}
                  className={STYLES.input}
                  value={it.caloriesBurned}
                  onChange={(e) => patch(i, 'caloriesBurned', e.target.value)}
                  placeholder="kcal"
                />
              </div>
            </>
          )}
        </div>
      ))}

      {error && <p className={STYLES.err}>{error}</p>}

      <div className={STYLES.actions}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  );
}
