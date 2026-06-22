import type { RecordDto } from '@/lib/types';

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  exerciseMinutes: number;
  caloriesBurned: number;
};

/** records 배열을 칼로리/매크로/운동 합계로 집계 */
export function sumRecords(records: RecordDto[]): DayTotals {
  const t: DayTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    exerciseMinutes: 0,
    caloriesBurned: 0,
  };
  for (const r of records) {
    for (const d of r.dietItems) {
      t.calories += d.calories ?? 0;
      t.protein += d.protein ?? 0;
      t.carbs += d.carbs ?? 0;
      t.fat += d.fat ?? 0;
    }
    for (const e of r.exerciseItems) {
      t.exerciseMinutes += e.durationMinutes ?? 0;
      t.caloriesBurned += e.caloriesBurned ?? 0;
    }
  }
  return t;
}
