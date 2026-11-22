'use client';

import { cn } from '@/lib/cn';
import type { DayFilterValue } from './day-entries';

const OPTIONS: { value: DayFilterValue; label: string }[] = [
  { value: 'ALL', label: '총합' },
  { value: 'DIET', label: '식단' },
  { value: 'EXERCISE', label: '운동' },
];

const STYLES = {
  wrap: 'grid grid-cols-3 gap-0.5 rounded-lg bg-subtle p-0.5',
  btn: 'rounded-md py-1.5 text-xs font-semibold text-muted transition-colors',
  active: 'bg-surface text-foreground shadow-sm',
} as const;

export function DayFilter({
  value,
  onChange,
}: {
  value: DayFilterValue;
  onChange: (next: DayFilterValue) => void;
}) {
  return (
    <div className={STYLES.wrap}>
      {OPTIONS.map((optional) => (
        <button
          key={optional.value}
          type="button"
          aria-pressed={value === optional.value}
          onClick={() => onChange(optional.value)}
          className={cn(STYLES.btn, value === optional.value && STYLES.active)}
        >
          {optional.label}
        </button>
      ))}
    </div>
  );
}
