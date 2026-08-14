'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { POPOVER_SURFACE } from '@/components/ui/surface';

const OPTIONS = [
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
  { value: '', label: '기타' },
];

const STYLES = {
  trigger:
    'flex shrink-0 items-center gap-1 rounded-lg bg-subtle px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:ring-2 focus:ring-accent/20',
  // z-[80]: 모달(z-[70])보다 위에 떠야 안 가림
  content: `z-[80] flex w-28 flex-col p-1 ${POPOVER_SURFACE}`,
  item: 'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-subtle',
} as const;

export function MealSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = OPTIONS.find((o) => o.value === value)?.label ?? '기타';

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={STYLES.trigger}>
          {label}
          <ChevronDown size={13} className="text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className={STYLES.content}>
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={STYLES.item}
            >
              {o.label}
              {o.value === value && <Check size={13} className="text-accent" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
