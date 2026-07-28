import type { RecordDto } from '@/lib/types';
import type { UpdateRecordInput } from '@/lib/client/records-api';

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
export type Draft = { record: RecordDto; items: EditItem[] };

export const toNum = (s: string) => (s.trim() !== '' ? Number(s) : undefined);

export function toEditItems(record: RecordDto): EditItem[] {
  return record.type === 'DIET'
    ? record.dietItems.map((it) => ({
        name: it.name,
        mealType: it.mealType ?? '',
        calories: it.calories != null ? String(it.calories) : '',
        durationMinutes: '',
        caloriesBurned: '',
      }))
    : record.exerciseItems.map((it) => ({
        name: it.name,
        mealType: '',
        calories: '',
        durationMinutes: it.durationMinutes != null ? String(it.durationMinutes) : '',
        caloriesBurned: it.caloriesBurned != null ? String(it.caloriesBurned) : '',
      }));
}

export function buildInput(d: Draft): UpdateRecordInput {
  const { record, items } = d;
  return record.type === 'DIET'
    ? {
        dietItems: items.map((it, i) => ({
          name: it.name.trim(),
          mealType: it.mealType || undefined,
          calories: toNum(it.calories),
          carbs: record.dietItems[i]?.carbs ?? undefined,
          protein: record.dietItems[i]?.protein ?? undefined,
          fat: record.dietItems[i]?.fat ?? undefined,
        })),
      }
    : {
        exerciseItems: items.map((it, i) => ({
          name: it.name.trim(),
          durationMinutes: toNum(it.durationMinutes),
          caloriesBurned: toNum(it.caloriesBurned),
          intensity: record.exerciseItems[i]?.intensity ?? undefined,
        })),
      };
}
