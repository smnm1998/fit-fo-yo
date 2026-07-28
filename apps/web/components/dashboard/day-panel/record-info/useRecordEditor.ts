'use client';

import { useState } from 'react';
import { updateRecord, ApiError } from '@/lib/client/records-api';
import { useDeleteRecord } from '@/lib/hooks/useDeleteRecord';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';
import { buildInput, toEditItems, type Draft, type EditItem } from './record-info-utils';

export function useRecordEditor() {
  const storeUpdate = useRecordsStore((s) => s.updateRecord);
  const deleteOne = useDeleteRecord();

  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function start(records: RecordDto[]) {
    setDrafts(records.map((record) => ({ record, items: toEditItems(record) })));
    setError(null);
    setConfirmId(null);
    setEditing(true);
  }
  function cancel() {
    setEditing(false);
    setError(null);
    setConfirmId(null);
  }
  function patch(recordId: string, i: number, key: keyof EditItem, value: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.record.id === recordId
          ? { ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)) }
          : d,
      ),
    );
  }
  async function saveAll() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await Promise.all(
        drafts.map((d) => updateRecord(d.record.id, buildInput(d))),
      );
      updated.forEach(storeUpdate);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '수정에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }
  async function remove(record: RecordDto) {
    await deleteOne(record);
    const next = drafts.filter((d) => d.record.id !== record.id);
    setDrafts(next);
    setConfirmId(null);
    if (next.length === 0) setEditing(false);
  }

  return {
    editing,
    drafts,
    saving,
    error,
    confirmId,
    setConfirmId,
    start,
    cancel,
    patch,
    saveAll,
    remove,
  };
}
