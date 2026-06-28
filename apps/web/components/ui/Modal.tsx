'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const SIZE = {
  sm: 'w-[min(360px,100%)]',
  md: 'w-[min(440px,100%)]',
} as const;

const STYLES = {
  overlay: 'fixed inset-0 z-40 bg-black/45 backdrop-blur-sm',
  content:
    'fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=open]:animate-[popIn_140ms_ease-out]',
  panel:
    'flex max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl ring-1 ring-black/5',
  head: 'flex items-center justify-between gap-2',
  title: 'text-base font-bold text-foreground',
  close: 'rounded-lg p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground',
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof SIZE;
  children: ReactNode;
};

export function Modal({ open, onClose, title, size = 'sm', children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={STYLES.overlay} />
        <Dialog.Content className={STYLES.content}>
          <div className={cn(STYLES.panel, SIZE[size])}>
            <div className={STYLES.head}>
              <Dialog.Title className={STYLES.title}>{title}</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="닫기" className={STYLES.close}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
