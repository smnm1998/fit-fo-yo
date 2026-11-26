import { describe, expect, it } from 'vitest';
import { mealDistribution, sumRecords, weekStreak } from '@/lib/records';
import type { DietItem, ExerciseItem, RecordDto } from '@/lib/types';

function record(over: Partial<RecordDto>): RecordDto {
  return {
    id: 'r',
    type: 'DIET',
    rawInput: '',
    recordedAt: '2026-11-24T03:00:00.000Z',
    createdAt: '2026-11-24T03:00:00.000Z',
    dietItems: [],
    exerciseItems: [],
    ...over,
  };
}

const diet = (over: Partial<DietItem>): DietItem => ({
  id: 'd',
  name: '음식',
  estimated: false,
  ...over,
});
const exercise = (over: Partial<ExerciseItem>): ExerciseItem => ({
  id: 'e',
  name: '운동',
  estimated: false,
  ...over,
});

/** KST 정오에 기록한 날 */
const on = (day: string) => record({ recordedAt: `${day}T03:00:00.000Z` });

describe('sumRecords', () => {
  it('식단, 운동을 합치고 비어 있는 값(null)은 0으로 친다.', () => {
    const totals = sumRecords([
      record({ dietItems: [diet({ calories: 500, protein: 20 }), diet({ calories: null })] }),
      record({
        type: 'EXERCISE',
        exerciseItems: [exercise({ durationMinutes: 30, caloriesBurned: 120 })],
      }),
    ]);

    expect(totals).toEqual({
      calories: 500,
      protein: 20,
      carbs: 0,
      fat: 0,
      exerciseMinutes: 30,
      caloriesBurned: 120,
    });
  });
});

describe('weekStreak', () => {
  it('기록한 날 표시, 기록한 날 수, 최장 연속 일수', () => {
    const days = ['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'];
    const streak = weekStreak(
      [on('2026-11-22'), on('2026-11-23'), on('2026-11-25'), on('2026-11-25')],
      days,
    );

    expect(streak.marks).toEqual([true, true, false, true, false]);
    expect(streak.count).toBe(3);
    expect(streak.longest).toBe(2);
  });
});

describe('mealDistribution', () => {
  it('정해진 끼니 순서로, 칼로리가 있는 끼니만 돌려준다', () => {
    const slices = mealDistribution([
      record({
        dietItems: [
          diet({ mealType: 'DINNER', calories: 700 }),
          diet({ mealType: 'BREAKFAST', calories: 300 }),
        ],
      }),
      record({
        dietItems: [
          diet({ mealType: 'LUNCH', calories: 0 }),
          diet({ mealType: null, calories: 150 }),
        ],
      }),
      record({ type: 'EXERCISE', exerciseItems: [exercise({ caloriesBurned: 200 })] }),
    ]);

    expect(slices).toEqual([
      { meal: 'BREAKFAST', calories: 300 },
      { meal: 'DINNER', calories: 700 },
      { meal: 'ETC', calories: 150 },
    ]);
  });
});
