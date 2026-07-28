import type { RecordDto } from '@/lib/types';

export type RecordType = 'DIET' | 'EXERCISE';

export const RECORD_TYPE_META: Record<
  RecordType,
  { label: string; dot: string; chip: string; badgeSoft: string; value: string }
> = {
  DIET: {
    label: '식단',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25',
    badgeSoft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  EXERCISE: {
    label: '운동',
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25',
    badgeSoft: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    value: 'text-sky-600 dark:text-sky-400',
  },
};

export const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
};

export const MEAL_OPTIONS = [
  { value: '', label: '식사 선택' },
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
];

/** 기록 대표 이름 (아이템명 합치기) */
export function recordName(r: RecordDto): string {
  const items = r.type === 'DIET' ? r.dietItems : r.exerciseItems;
  return items.map((i) => i.name).join(', ') || RECORD_TYPE_META[r.type].label;
}

/** 기록 대표 수치 (식단=섭취 / 운동=소모 kcal) */
export function recordTotalKcal(r: RecordDto): number {
  return r.type === 'DIET'
    ? r.dietItems.reduce((s, i) => s + (i.calories ?? 0), 0)
    : r.exerciseItems.reduce((s, i) => s + (i.caloriesBurned ?? 0), 0);
}

/** 식단 기록의 대표 식사 레벨 (없으면 null) */
export function recordMealLabel(r: RecordDto): string | null {
  if (r.type !== 'DIET') return null;
  const meal = r.dietItems.find((i) => i.mealType)?.mealType;
  return meal ? (MEAL_LABEL[meal] ?? meal) : null;
}

/** 채팅 확인 문구 */
export function recordSummary(r: RecordDto): string {
  const name = recordName(r);
  if (r.type === 'DIET') {
    const kcal = r.dietItems.reduce((s, i) => s + (i.calories ?? 0), 0);
    return `${name}${kcal ? `${kcal}kcal` : ''} 기록했어요`;
  }
  const min = r.exerciseItems.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
  return `${name}${min ? ` ${min}분` : ''} 기록했어요`;
}
