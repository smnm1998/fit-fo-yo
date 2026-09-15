import type { FoodNutrition } from '@fitfoyo/database';
import {
  DEFAULT_WEIGHT_KG,
  groundCalories,
  resolveCaloriesBurned,
  toDietItemInput,
  toExerciseItemInput,
} from './calorie.calculator';

/** seed.ts와 동일한 실제 등록값 */
function food(name: string, caloriesPer100g: number, gramsPerServing: number): FoodNutrition {
  return {
    id: 1,
    name,
    caloriesPer100g,
    gramsPerServing,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const TABLE = new Map<string, FoodNutrition>([
  ['불닭볶음면', food('불닭볶음면', 408, 130)],
  ['닭가슴살', food('닭가슴살', 165, 100)],
]);

describe('groundCalories - 등록 음식 (DB 근거)', () => {
  it('개수 단위면 대표 그램수 x 수량으로 환산한다. (불닭볶음면 2봉 = 1061)', () => {
    expect(
      groundCalories(
        {
          name: '불닭볶음면',
          quantity: 2,
          unit: '봉지',
          calories: 4000,
          estimated: true,
        },
        TABLE,
      ),
    ).toEqual({ calories: 1061, grams: 260, estimated: false });
  });

  it('1봉 값(530)과 2봉 값(1061)과 혼동하지 않는다.', () => {
    expect(
      groundCalories({ name: '불닭볶음면', quantity: 1, unit: '봉지', estimated: true }, TABLE),
    ).toEqual({ calories: 530, grams: 130, estimated: false });
  });

  it('LLM이 부풀린 칼로리(4000)를 무시하고 DB 값으로 덮어쓴다.', () => {
    const { calories } = groundCalories(
      {
        name: '불닭볶음면',
        quantity: 2,
        unit: '봉지',
        calories: 4000,
        estimated: true,
      },
      TABLE,
    );
    expect(calories).not.toBe(4000);
  });

  it('g 단위는 LLM이 준 그램수를 그대로 신뢰한다 (닭가슴살 200g = 330)', () => {
    expect(
      groundCalories(
        {
          name: '닭가슴살',
          quantity: 200,
          unit: 'g',
          gramsEstimate: 200,
          estimated: true,
        },
        TABLE,
      ),
    ).toEqual({ calories: 330, grams: 200, estimated: false });
  });

  it('공백&대소문자가 달라도 정규화해서 찾는다', () => {
    expect(groundCalories({ name: '불닭 볶음면', estimated: true }, TABLE).estimated).toBe(false);
  });

  it('수량이 없으면 1인분으로 본다', () => {
    expect(groundCalories({ name: '불닭볶음면', unit: '봉지', estimated: true }, TABLE).grams).toBe(
      130,
    );
  });
});

describe('groundCalories - 미등록 음식 (LLM 폴백)', () => {
  it('100g당 kcal x 환산 그램으로 서버가 재계산하고 estimated를 유지한다.', () => {
    expect(
      groundCalories(
        {
          name: '메가커피 바닐라라떼',
          caloriesPer100g: 60,
          gramsEstimate: 400,
          calories: 150,
          estimated: true,
        },
        TABLE,
      ),
    ).toEqual({ calories: 240, grams: 400, estimated: true });
  });

  it('근거값이 없으면 LLM 이 준 칼로리로 폴백한다', () => {
    expect(
      groundCalories({ name: '할머니 김치찌개', calories: 350, estimated: true }, TABLE),
    ).toEqual({ calories: 350, grams: undefined, estimated: true });
  });
});

describe('resolveCaloriesBurned — MET × 3.5 × 체중 / 200 × 분', () => {
  it('체중이 반영된다 (MET 8 · 30분 · 70kg = 294)', () => {
    expect(resolveCaloriesBurned({ met: 8, durationMinutes: 30 }, 70)).toBe(294);
  });

  it('같은 운동도 체중이 다르면 값이 다르다 (65kg = 273)', () => {
    expect(resolveCaloriesBurned({ met: 8, durationMinutes: 30 }, DEFAULT_WEIGHT_KG)).toBe(273);
  });

  it('MET 이 없으면 LLM 값으로 폴백한다', () => {
    expect(resolveCaloriesBurned({ durationMinutes: 30, caloriesBurned: 200 }, 70)).toBe(200);
  });

  it('시간이 0이면 계산하지 않고 폴백한다', () => {
    expect(resolveCaloriesBurned({ met: 8, durationMinutes: 0, caloriesBurned: 5 }, 70)).toBe(5);
  });
});

describe('아이템 매핑', () => {
  it('toDietItemInput 은 grounding 결과를 grams·calories·estimated 에 반영한다', () => {
    expect(
      toDietItemInput(
        {
          name: '불닭볶음면',
          quantity: 2,
          unit: '봉지',
          mealType: '',
          calories: 4000,
          estimated: true,
        } as unknown as Parameters<typeof toDietItemInput>[0],
        TABLE,
      ),
    ).toMatchObject({
      name: '불닭볶음면',
      mealType: undefined,
      quantity: 2,
      grams: 260,
      calories: 1061,
      estimated: false,
    });
  });

  it('toExerciseItemInput 은 LLM 값 대신 체중으로 재계산한다', () => {
    expect(
      toExerciseItemInput(
        {
          name: '달리기',
          durationMinutes: 30,
          met: 8,
          caloriesBurned: 999,
          estimated: true,
        } as Parameters<typeof toExerciseItemInput>[0],
        70,
      ),
    ).toMatchObject({ name: '달리기', caloriesBurned: 294, estimated: true });
  });
});
