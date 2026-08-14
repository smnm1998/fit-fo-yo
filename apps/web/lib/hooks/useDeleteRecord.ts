import { deleteRecord, ApiError } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import type { RecordDto } from '@/lib/types';

export function useDeleteRecord() {
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const restoreRecord = useRecordsStore((s) => s.restoreRecord);
  const setNotice = useRecordsStore((s) => s.setNotice);

  return async function deleteOne(record: RecordDto) {
    removeRecord(record.id);
    try {
      await deleteRecord(record.id);
    } catch (err) {
      restoreRecord(record);
      setNotice(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
    }
  };
}
