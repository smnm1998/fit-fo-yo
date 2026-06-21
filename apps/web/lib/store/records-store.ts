import { create } from 'zustand';
import type { RecordDto } from '@/lib/types';

export type PendingRecord = {
  tempId: string;
  rawInput: string;
  status: 'pending' | 'error';
  error?: string;
};

type RecordsState = {
  records: RecordDto[];
  pending: PendingRecord[];
  notice: string | null;
  setRecords: (records: RecordDto[]) => void;
  addPending: (p: PendingRecord) => void;
  resolvePending: (tempId: string, record: RecordDto) => void;
  failPending: (tempId: string, error: string) => void;
  dismissPending: (tempId: string) => void;
  removeRecord: (id: string) => void;
  restoreRecord: (record: RecordDto) => void;
  setNotice: (notice: string | null) => void;
};

export const useRecordsStore = create<RecordsState>((set) => ({
  records: [],
  pending: [],
  notice: null,
  setRecords: (records) => set({ records }),
  addPending: (p) => set((s) => ({ pending: [p, ...s.pending] })),
  resolvePending: (tempId, record) =>
    set((s) => ({
      pending: s.pending.filter((p) => p.tempId !== tempId),
      records: [record, ...s.records],
    })),
  failPending: (tempId, error) =>
    set((s) => ({
      pending: s.pending.map((p) => (p.tempId === tempId ? { ...p, status: 'error', error } : p)),
    })),
  dismissPending: (tempId) =>
    set((s) => ({ pending: s.pending.filter((p) => p.tempId !== tempId) })),
  removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  restoreRecord: (record) =>
    set((s) => ({
      records: [...s.records, record].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    })),
  setNotice: (notice) => set({ notice }),
}));
