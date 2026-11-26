import { beforeEach, describe, expect, it } from 'vitest';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';

function record(id: string, recordedAt: string): RecordDto {
  return {
    id,
    type: 'DIET',
    rawInput: '',
    recordedAt,
    createdAt: recordedAt,
    dietItems: [],
    exerciseItems: [],
  };
}

const ids = () => useRecordsStore.getState().records.map((r) => r.id);

describe('records store (낙관적 업데이트에 쓰는 동작)', () => {
  beforeEach(() => useRecordsStore.setState({ records: [], notice: null }));

  it('지웠다가 되돌리면 최신순 원래 자리로 돌아온다 (삭제 실패 시 복구)', () => {
    const a = record('a', '2026-11-24T09:00:00.000Z');
    const b = record('b', '2026-11-24T08:00:00.000Z');
    const c = record('c', '2026-11-24T07:00:00.000Z');
    const { setRecords, removeRecord, restoreRecord } = useRecordsStore.getState();

    setRecords([a, b, c]);
    removeRecord('b');
    expect(ids()).toEqual(['a', 'c']);

    restoreRecord(b);
    expect(ids()).toEqual(['a', 'b', 'c']);
  });

  it('updateRecord는 id가 같은 기록만 바꾼다 (날짜 옮기기)', () => {
    const a = record('a', '2026-11-24T09:00:00.000Z');
    const b = record('b', '2026-11-24T08:00:00.000Z');
    const { setRecords, updateRecord } = useRecordsStore.getState();

    setRecords([a, b]);
    updateRecord({ ...b, recordedAt: '2026-11-20T08:00:00.000Z' });

    expect(useRecordsStore.getState().records).toEqual([
      a,
      { ...b, recordedAt: '2026-11-20T08:00:00.000Z' },
    ]);
  });
});
