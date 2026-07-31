'use client';

import { useMemo, useState } from 'react';
import { Utensils, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';
import { RECORD_TYPE_META } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';
import { MEAL_ORDER, MEAL_TAB_LABEL } from './record-info/record-info-utils';
import { RecordCard } from './record-info/RecordCard';

const TYPE_ICON = { DIET: Utensils, EXERCISE: Dumbbell } as const;

const STYLES = {
  tabBar: 'flex w-fit gap-1 rounded-lg bg-subtle p-0.5',
  tabBtn: 'rounded-md px-3 py-1 text-xs font-medium text-muted transition-colors',
  tabActive: 'bg-surface text-foreground shadow-sm',
  empty: 'py-8 text-center text-sm text-muted',
  list: 'flex flex-col gap-2',
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

  const type = records[0]?.type ?? 'DIET';
  const Icon = TYPE_ICON[type];
  const titleIcon = <Icon size={18} className={cn('shrink-0', RECORD_TYPE_META[type].value)} />;

  return (
    <Modal open onClose={onClose} title={title} titleIcon={titleIcon} size="md">
      {tabs && (
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
      )}
      <div className={STYLES.list}>
        {shown.length === 0 ? (
          <p className={STYLES.empty}>이 끼니에는 아직 기록이 없어요.</p>
        ) : (
          shown.flatMap((record) => {
            const items = record.type === 'DIET' ? record.dietItems : record.exerciseItems;
            return items.map((_, i) => (
              <RecordCard key={`${record.id}:${i}`} record={record} index={i} />
            ));
          })
        )}
      </div>
    </Modal>
  );
}
