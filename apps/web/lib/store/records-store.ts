import { create } from 'zustand';
import type { RecordDto } from '@/lib/types';

type RecordsState = {
  records: RecordDto[];
  notice: string | null;
  setRecords: (records: RecordDto[]) => void;
  addRecord: (record: RecordDto) => void;
  updateRecord: (record: RecordDto) => void;
  removeRecord: (id: string) => void;
  restoreRecord: (record: RecordDto) => void;
  setNotice: (notice: string | null) => void;
};

export const useRecordsStore = create<RecordsState>((set) => ({
  records: [],
  notice: null,
  setRecords: (records) => set({ records }),
  addRecord: (record) => set((s) => ({ records: [record, ...s.records] })),
  updateRecord: (record) =>
    set((s) => ({ records: s.records.map((r) => (r.id === record.id ? record : r)) })),
  removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  restoreRecord: (record) =>
    set((s) => ({
      records: [...s.records, record].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    })),
  setNotice: (notice) => set({ notice }),
}));
