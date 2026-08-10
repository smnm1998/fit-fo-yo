'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';
import { RECORD_TYPE_META } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';
import { MEAL_ORDER, MEAL_TAB_LABEL } from './record-info/record-info-utils';
import { RecordCard } from './record-info/RecordCard';
import { Salad, Activity, CircleAlert } from 'lucide-react';

const TYPE_ICON = { DIET: Salad, EXERCISE: Activity } as const;

const STYLES = {
  tabBar: '-ml-1 flex w-fit gap-1 rounded-lg bg-subtle p-0.5',
  tabBtn: 'rounded-md px-3 py-1 text-xs font-medium text-muted transition-colors',
  tabActive: 'bg-surface text-foreground shadow-sm',
  empty: 'py-8 text-center text-sm text-muted',
  list: 'flex flex-col gap-2',
} as const;

type DietRef = { record: RecordDto; index: number };

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
    const m: Record<string, DietRef[]> = {};
    for (const r of records) {
      r.dietItems.forEach((it, index) => {
        const key = it.mealType ?? 'ETC';
        (m[key] ??= []).push({ record: r, index });
      });
    }
    return m;
  }, [records]);

  const availMeals = MEAL_ORDER.filter((k) => byMeal[k]?.length);
  const [tab, setTab] = useState<string>(
    defaultMeal && (MEAL_ORDER as readonly string[]).includes(defaultMeal)
      ? defaultMeal
      : (availMeals[0] ?? 'BREAKFAST'),
  );

  const type = records[0]?.type ?? 'DIET';
  const Icon = TYPE_ICON[type];
  const titleIcon = (
    <span
      className={cn(
        'grid h-6 w-6 shrink-0 place-items-center rounded-full',
        RECORD_TYPE_META[type].dot,
      )}
    >
      <Icon size={14} className="text-white" />
    </span>
  );
  const showBurnBasis =
    type === 'EXERCISE' && records.some((r) => r.exerciseItems.some((it) => it.estimated));

  return (
    <Modal open onClose={onClose} title={title} titleIcon={titleIcon} size="md">
      {showBurnBasis && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>소모 칼로리는 체중 65kg 기준으로 추정한 값이에요.</span>
        </p>
      )}
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
        {tabs ? (
          (byMeal[tab] ?? []).length === 0 ? (
            <p className={STYLES.empty}>이 끼니에는 아직 기록이 없어요.</p>
          ) : (
            (byMeal[tab] ?? []).map(({ record, index }) => (
              <RecordCard key={`${record.id}:${index}`} record={record} index={index} />
            ))
          )
        ) : (
          records.flatMap((record) =>
            record.exerciseItems.map((_, i) => (
              <RecordCard key={`${record.id}:${i}`} record={record} index={i} />
            )),
          )
        )}
      </div>
    </Modal>
  );
}
