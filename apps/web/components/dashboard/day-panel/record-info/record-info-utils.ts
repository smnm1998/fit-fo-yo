import type { RecordDto, DietItem, ExerciseItem } from '@/lib/types';
import type { UpdateRecordInput, CreateRecordInput } from '@/lib/client/records-api';

export const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ETC'] as const;
export const MEAL_TAB_LABEL: Record<string, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
  ETC: '기타',
};

export type EditItem = {
  name: string;
  mealType: string;
  calories: string;
  durationMinutes: string;
  caloriesBurned: string;
};

type DietInput = NonNullable<CreateRecordInput['dietItems']>[number];
type ExerciseInput = NonNullable<CreateRecordInput['exerciseItems']>[number];

const toNum = (s: string) => (s.trim() !== '' ? Number(s) : undefined);

export function itemCount(record: RecordDto): number {
  return record.type === 'DIET' ? record.dietItems.length : record.exerciseItems.length;
}

export function toEditItem(record: RecordDto, index: number): EditItem {
  if (record.type === 'DIET') {
    const it = record.dietItems[index];
    return {
      name: it?.name ?? '',
      mealType: it?.mealType ?? '',
      calories: it?.calories != null ? String(it.calories) : '',
      durationMinutes: '',
      caloriesBurned: '',
    };
  }
  const it = record.exerciseItems[index];
  return {
    name: it?.name ?? '',
    mealType: '',
    calories: '',
    durationMinutes: it?.durationMinutes != null ? String(it.durationMinutes) : '',
    caloriesBurned: it?.caloriesBurned != null ? String(it.caloriesBurned) : '',
  };
}

// 기존 아이템 보존 (estimated/quantity/unit 포함 → 편집·삭제 시 형제 배지 유지)
function dietToInput(it: DietItem): DietInput {
  return {
    name: it.name,
    mealType: it.mealType ?? undefined,
    quantity: it.quantity ?? undefined,
    unit: it.unit ?? undefined,
    calories: it.calories ?? undefined,
    carbs: it.carbs ?? undefined,
    protein: it.protein ?? undefined,
    fat: it.fat ?? undefined,
    estimated: it.estimated,
  };
}
function exerciseToInput(it: ExerciseItem): ExerciseInput {
  return {
    name: it.name,
    durationMinutes: it.durationMinutes ?? undefined,
    caloriesBurned: it.caloriesBurned ?? undefined,
    intensity: it.intensity ?? undefined,
    estimated: it.estimated,
  };
}

/** index 아이템만 edit 값으로 교체, 나머지는 그대로 보존 */
export function buildReplace(record: RecordDto, index: number, edit: EditItem): UpdateRecordInput {
  if (record.type === 'DIET') {
    return {
      dietItems: record.dietItems.map((it, i) =>
        i === index
          ? {
              ...dietToInput(it),
              name: edit.name.trim(),
              mealType: edit.mealType || undefined,
              calories: toNum(edit.calories),
            }
          : dietToInput(it),
      ),
    };
  }
  return {
    exerciseItems: record.exerciseItems.map((it, i) =>
      i === index
        ? {
            ...exerciseToInput(it),
            name: edit.name.trim(),
            durationMinutes: toNum(edit.durationMinutes),
            caloriesBurned: toNum(edit.caloriesBurned),
          }
        : exerciseToInput(it),
    ),
  };
}

/** index 아이템만 제거, 나머지는 그대로 보존 */
export function buildRemove(record: RecordDto, index: number): UpdateRecordInput {
  return record.type === 'DIET'
    ? { dietItems: record.dietItems.filter((_, i) => i !== index).map(dietToInput) }
    : { exerciseItems: record.exerciseItems.filter((_, i) => i !== index).map(exerciseToInput) };
}
