'use client';

import { Plus } from 'lucide-react';
import { AiMark } from './chat/AiMark';

const STYLES = {
  wrap: 'grid grid-cols-2 gap-2',
  ghost:
    'flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-subtle',
  primary:
    'flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-surface transition-opacity hover:opacity-90',
} as const;

export function DayActions({ onManual, onAi }: { onManual: () => void; onAi: () => void }) {
  return (
    <div className={STYLES.wrap}>
      <button type="button" onClick={onManual} className={STYLES.ghost}>
        <Plus size={15} />
        직접 입력
      </button>
      <button type="button" onClick={onAi} className={STYLES.primary}>
        <AiMark size={15} />
        AI로 기록
      </button>
    </div>
  );
}
