'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MEAL_LABEL } from '@/lib/record-meta';
import { useDeleteRecord } from '@/lib/hooks/useDeleteRecord';
import { RecordEditForm } from '@/components/records/RecordEditForm';
import type { RecordDto } from '@/lib/types';

const STYLES = {
  list: 'flex flex-col gap-3',
  card: 'flex flex-col gap-2 rounded-xl border border-border p-3',
  itemRow: 'flex items-center justify-between gap-2 text-sm',
  itemName: 'min-w-0 truncate text-foreground',
  itemMetric: 'shrink-0 tabular-nums text-muted',
  actions: 'flex justify-end gap-1 pt-1',
} as const;

export function RecordInfoModal({
  title,
  records,
  onClose,
}: {
  title: string;
  records: RecordDto[];
  onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const deleteOne = useDeleteRecord();

  return (
    <Modal open onClose={onClose} title={title} size="md">
      <div className={STYLES.list}>
        {records.map((record) =>
          editingId === record.id ? (
            <div key={record.id} className={STYLES.card}>
              <RecordEditForm
                record={record}
                onSaved={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={record.id} className={STYLES.card}>
              {record.type === 'DIET'
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
                <Button variant="ghost" size="sm" onClick={() => setEditingId(record.id)}>
                  <Pencil size={14} /> 수정
                </Button>
                <Button variant="danger" size="sm" onClick={() => void deleteOne(record)}>
                  <Trash2 size={14} /> 삭제
                </Button>
              </div>
            </div>
          ),
        )}
      </div>
    </Modal>
  );
}
