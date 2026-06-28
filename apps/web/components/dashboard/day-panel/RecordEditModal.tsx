'use client';

import { Modal } from '@/components/ui/Modal';
import { RecordEditForm } from '@/components/records/RecordEditForm';
import type { RecordDto } from '@/lib/types';

export function RecordEditModal({ record, onClose }: { record: RecordDto; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="기록 수정">
      <RecordEditForm record={record} onSaved={onClose} onCancel={onClose} />
    </Modal>
  );
}
