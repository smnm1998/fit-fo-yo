'use client';

import { Modal } from '@/components/ui/Modal';
import { ManualRecordForm } from '@/components/calendar/ManualRecordForm';

type Props = {
  recordedAt: string;
  dateText: string;
  onClose: () => void;
};

export function AddRecordModal({ recordedAt, dateText, onClose }: Props) {
  return (
    <Modal open onClose={onClose} title="기록 추가">
      <ManualRecordForm recordedAt={recordedAt} dateText={dateText} onSuccess={onClose} />
    </Modal>
  );
}
