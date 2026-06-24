'use client';

import { Columns2, LayoutGrid, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore, type ViewMode } from '@/lib/store/ui-store';

const OPTIONS: { mode: ViewMode; label: string; Icon: LucideIcon }[] = [
  { mode: 'split', label: '분할', Icon: Columns2 },
  { mode: 'month', label: '월간', Icon: LayoutGrid },
];

const STYLES = {
  wrap: 'inline-flex rounded-lg border border-border bg-surface p-0.5',
  btn: 'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground',
  active: 'bg-subtle text-foreground',
} as const;

export function ViewToggle() {
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  return (
    <div className={STYLES.wrap} role="tablist" aria-label="뷰 전환">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={viewMode === mode}
          onClick={() => setViewMode(mode)}
          className={cn(STYLES.btn, viewMode === mode && STYLES.active)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
