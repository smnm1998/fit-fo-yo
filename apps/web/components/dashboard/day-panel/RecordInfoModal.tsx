'use client';

import { useMemo, useState } from 'react';
import { Utensils, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RECORD_TYPE_META } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';
import { MEAL_ORDER, MEAL_TAB_LABEL } from './record-info/record-info-utils';
import { useRecordEditor } from './record-info/useRecordEditor';
import { RecordViewCard, RecordEditCard } from './record-info/RecordCards';

const TYPE_ICON = { DIET: Utensils, EXERCISE: Dumbbell } as const;

const STYLES = {
  toolbar: 'flex items-center justify-between gap-2',
  tabBar: 'flex w-fit gap-1 rounded-lg bg-subtle p-0.5',
  tabBtn: 'rounded-md px-3 py-1 text-xs font-medium text-muted transition-colors',
  tabActive: 'bg-surface text-foreground shadow-sm',
  editHint: 'text-xs font-medium text-muted',
  empty: 'py-8 text-center text-sm text-muted',
  list: 'flex flex-col gap-2',
  err: 'text-[11px] text-danger',
} as const;

export function RecordInfoModal({
  records,
  tabs,
  defaultMeal,
  title,
  onClose,
}: {
  records: RecordDto[];
  tabs: boolean;
  defaultMeal?: string;
  title: string;
  onClose: () => void;
}) {
  const byMeal = useMemo(() => {
    const m: Record<string, RecordDto[]> = {};
    for (const r of records) {
      const key = r.dietItems[0]?.mealType ?? 'ETC';
      (m[key] ??= []).push(r);
    }
    return m;
  }, [records]);

  const availMeals = MEAL_ORDER.filter((k) => byMeal[k]?.length);
  const [tab, setTab] = useState<string>(
    defaultMeal && (MEAL_ORDER as readonly string[]).includes(defaultMeal)
      ? defaultMeal
      : (availMeals[0] ?? 'BREAKFAST'),
  );
  const shown = tabs ? (byMeal[tab] ?? []) : records;

  const ed = useRecordEditor();

  const type = records[0]?.type ?? 'DIET';
  const Icon = TYPE_ICON[type];
  const titleIcon = <Icon size={18} className={cn('shrink-0', RECORD_TYPE_META[type].value)} />;

  const left = ed.editing ? (
    <span className={STYLES.editHint}>편집 중{tabs ? ` · ${MEAL_TAB_LABEL[tab]}` : ''}</span>
  ) : tabs ? (
    <div className={STYLES.tabBar}>
      {MEAL_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setTab(m)}
          className={cn(STYLES.tabBtn, tab === m && STYLES.tabActive)}
        >
          {MEAL_TAB_LABEL[m]}
        </button>
      ))}
    </div>
  ) : (
    <span />
  );

  const right = ed.editing ? (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={ed.cancel} disabled={ed.saving}>
        취소
      </Button>
      <Button variant="primary" size="sm" onClick={() => void ed.saveAll()} disabled={ed.saving}>
        {ed.saving ? '저장 중…' : '저장'}
      </Button>
    </div>
  ) : shown.length > 0 ? (
    <Button variant="ghost" size="sm" onClick={() => ed.start(shown)}>
      편집
    </Button>
  ) : (
    <span />
  );

  return (
    <Modal open onClose={onClose} title={title} titleIcon={titleIcon} size="md">
      <div className={STYLES.toolbar}>
        {left}
        {right}
      </div>

      {ed.error && <p className={STYLES.err}>{ed.error}</p>}

      <div className={STYLES.list}>
        {ed.editing ? (
          ed.drafts.map((d) => (
            <RecordEditCard
              key={d.record.id}
              draft={d}
              confirming={ed.confirmId === d.record.id}
              onPatch={(i, key, value) => ed.patch(d.record.id, i, key, value)}
              onArm={() => ed.setConfirmId(d.record.id)}
              onCancelConfirm={() => ed.setConfirmId(null)}
              onDelete={() => void ed.remove(d.record)}
            />
          ))
        ) : shown.length === 0 ? (
          <p className={STYLES.empty}>이 끼니에는 아직 기록이 없어요.</p>
        ) : (
          shown.map((record) => <RecordViewCard key={record.id} record={record} />)
        )}
      </div>
    </Modal>
  );
}
