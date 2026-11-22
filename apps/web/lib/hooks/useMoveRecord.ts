import { updateRecord, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { dayKeyKST, moveToDayKST } from '@/lib/date';
import type { RecordDto } from '@/lib/types';

/** store에 있는 같은 기록의 현재 recordedAt (삭제됐으면 null) */
function currentRecordedAt(id: string): string | null {
  return useRecordsStore.getState().records.find((r) => r.id === id)?.recordedAt ?? null;
}

/**
 * 기록을 다른 날짜로 옮긴다 (KST 시각 유지)
 * 먼저 화면에서 옮기고, 실패하면 원래 날짜로 되돌린다.
 * 데스크탑 드래그 & 모바일 바텀시트 "날짜 옮기기" 공용
 */
export function useMoveRecord() {
  const storeUpdate = useRecordsStore((s) => s.updateRecord);
  const setNotice = useRecordsStore((s) => s.setNotice);

  return async function moveOne(record: RecordDto, toDay: string) {
    if (dayKeyKST(record.recordedAt) === toDay) return;

    const recordedAt = moveToDayKST(record.recordedAt, toDay);
    storeUpdate({ ...record, recordedAt });

    try {
      const saved = await updateRecord(record.id, { recordedAt });
      // 응답 기다리는 사이에 옮겼거나 삭제했으면 더 최신 상태를 덮지는 않음
      if (currentRecordedAt(record.id) === recordedAt) storeUpdate(saved);
    } catch (err) {
      if (currentRecordedAt(record.id) === recordedAt) storeUpdate(record);
      setNotice(err instanceof ApiError ? err.message : '날짜를 옮기지 못했어요.');
    }
  };
}
