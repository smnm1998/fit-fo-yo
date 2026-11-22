'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const STYLES = {
  overlay:
    'fixed inset-0 z-[60] bg-black/40 data-[state=open]:animate-[fadeIn_180ms_ease-out] wide:hidden',
  content:
    'fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col rounded-t-2xl bg-background px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_40px_rgba(0,0,0,0.14)] outline-none data-[state=open]:animate-[sheetUp_240ms_cubic-bezier(0.22,1,0.36,1)] wide:hidden',
  handle: 'mx-auto mb-1 h-1 w-9 shrink-0 rounded-full bg-border',
  body: 'min-h-0 flex-1 overflow-y-auto',
} as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function DaySheet({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={STYLES.overlay} />
        <Dialog.Content className={STYLES.content} aria-describedby={undefined}>
          {/** 시트는 날짜가 제목이지만, 화면에는 패널 헤더가 이미 보임 */}
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <span className={STYLES.handle} aria-hidden />
          <div className={STYLES.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
