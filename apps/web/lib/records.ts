import type { RecordDto } from '@/lib/types';
import { dayKeyKST } from '@/lib/date';

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

export type DayPoint = DayTotals & { date: string };

export function sumRecordsByDay(records: RecordDto[], dayKeys: string[]): DayPoint[] {
  const groups = new Map<string, RecordDto[]>(dayKeys.map((k) => [k, []]));
  for (const r of records) {
    groups.get(dayKeyKST(r.recordedAt))?.push(r);
  }
  return dayKeys.map((date) => ({ date, ...sumRecords(groups.get(date) ?? []) }));
}

/** dayKeys에 속하는 레코드만 추림 */
export function partitionByKeys(records: RecordDto[], dayKeys: string[]): RecordDto[] {
  const set = new Set(dayKeys);
  return records.filter((r) => set.has(dayKeyKST(r.recordedAt)));
}

export type Trend = { value: number; prev: number; delta: number; pct: number | null };

function trend(value: number, prev: number): Trend {
  const delta = value - prev;
  const pct = prev === 0 ? null : Math.round((delta / prev) * 100);
  return { value, prev, delta, pct };
}

export type WeekComparison = {
  calories: Trend;
  caloriesBurned: Trend;
  net: Trend;
  count: Trend;
};

export function compareWeeks(
  thisW: DayTotals,
  lastW: DayTotals,
  thisCount: number,
  lastCount: number,
): WeekComparison {
  return {
    calories: trend(thisW.calories, lastW.calories),
    caloriesBurned: trend(thisW.caloriesBurned, lastW.caloriesBurned),
    net: trend(thisW.calories - thisW.caloriesBurned, lastW.calories - lastW.caloriesBurned),
    count: trend(thisCount, lastCount),
  };
}

export type Streak = { marks: boolean[]; count: number; longest: number };

/** dayKeys 각 날에 기록이 있었는지 + 총 일수 + 최장 연속 */
export function weekStreak(records: RecordDto[], dayKeys: string[]): Streak {
  const recorded = new Set(records.map((r) => dayKeyKST(r.recordedAt)));
  const marks = dayKeys.map((k) => recorded.has(k));
  let count = 0;
  let longest = 0;
  let run = 0;
  for (const m of marks) {
    if (m) {
      count += 1;
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return { marks, count, longest };
}
