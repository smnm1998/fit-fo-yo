'use client';

import { Card } from '@/components/ui/Card';
import type { DietItem, ExerciseItem, RecordDto } from '@/lib/types';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
};

const STYLES = {
  head: 'mb-3 flex items-center justify-between',
  type: 'rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-foreground',
  time: 'text-xs text-muted',
  items: 'flex flex-col gap-2.5',
  item: 'text-sm font-medium text-foreground',
  name: 'text-sm font-medium text-foreground',
  badge: 'ml-1.5 rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-muted',
  meta: 'mt-0.5 text-xs text-muted',
  metric: 'shrink-0 text-sm tabular-nums text-foreground',
} as const;

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function RecordCard({ record }: { record: RecordDto }) {
  const isDiet = record.type === 'DIET';
  return (
    <Card>
      <div className={STYLES.head}>
        <span className={STYLES.type}>{isDiet ? '식단' : '운동'}</span>
        <span className={STYLES.time}>{timeLabel(record.recordedAt)}</span>
      </div>
      <div className={STYLES.items}>
        {isDiet
          ? record.dietItems.map((it) => <DietRow key={it.id} item={it} />)
          : record.exerciseItems.map((it) => <ExerciseRow key={it.id} item={it} />)}
      </div>
    </Card>
  );
}

function DietRow({ item }: { item: DietItem }) {
  const meta = [
    item.quantity ? `${item.quantity}${item.unit ?? ''}` : null,
    item.mealType ? (MEAL_LABEL[item.mealType] ?? item.mealType) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className={STYLES.item}>
      <div>
        <span className={STYLES.name}>{item.name}</span>
        {item.estimated && <span className={STYLES.badge}>추정</span>}
        {meta && <div className={STYLES.meta}>{meta}</div>}
      </div>
      {typeof item.calories === 'number' && <span className={STYLES.metric}>{item.calories}</span>}
    </div>
  );
}

function ExerciseRow({ item }: { item: ExerciseItem }) {
  const meta = [item.durationMinutes ? `${item.durationMinutes}분` : null, item.intensity]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className={STYLES.item}>
      <div>
        <span className={STYLES.name}>{item.name}</span>
        {item.estimated && <span className={STYLES.badge}>추정</span>}
        {meta && <div className={STYLES.meta}>{meta}</div>}
      </div>
      {typeof item.caloriesBurned === 'number' && (
        <span className={STYLES.metric}>{item.caloriesBurned} kcal</span>
      )}
    </div>
  );
}
