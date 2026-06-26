'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { RecordEditForm } from '@/components/records/RecordEditForm';
import type { RecordDto } from '@/lib/types';

const STYLES = {
  overlay: 'fixed inset-0 z-40 bg-black/30',
  content:
    'fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=open]:animate-[popIn_140ms_ease_out]',
  panel:
    'flex w-[min(360px, 100%)] flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-xl',
  head: 'flex items-center justify-between',
  title: 'text-sm font-bold text-foreground',
  close: 'rounded-lg p-1 text-muted transition-colors hover:bg-subtle hover:text-foreground',
} as const;

export function RecordEditModal({ record, onClose }: { record: RecordDto; onClose: () => void }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={STYLES.overlay} />
        <Dialog.Content className={STYLES.content}>
          <div className={STYLES.panel}>
            <Dialog.Title className={STYLES.title}>기록 수정</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="닫기" className={STYLES.close}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <RecordEditForm record={record} onSaved={onClose} onCancel={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
