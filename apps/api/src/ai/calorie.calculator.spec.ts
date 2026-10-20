import type { FoodNutrition } from '@fitfoyo/database';
import { estimateOf, groundCalories, newEstimates, toMealType } from './calorie.calculator';
import type { FoodEstimate } from '../nutrition/nutrition.service';

/** 테스트용 영양 행 - 식약처에서 실제로 조회한 값 (2026-10-01) */
function food(
  name: string,
  foodCd: string,
  caloriesPer100g: number,
  gramsPerServing: number | null,
): FoodNutrition {
  return {
    id: 1,
    name,
    foodCd,
    foodNm: name,
    caloriesPer100g,
    gramsPerServing,
    referenceDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const TABLE = new Map<string, FoodNutrition>([
  // 가공식품: 379kcal/100g, 포장 내용량 140g
  ['불닭볶음면', food('불닭볶음면', 'P108-009000400-0210', 379, 140)],
  // 원재료 닭고기_가슴(껍질 제거)_삶은것: 127kcal/100g, 1회 분량 없음
  ['닭가슴살', food('닭가슴살', 'R209-008000546-0000', 127, null)],
  // 음식(외식 분석값): 61kcal/100g, 1회 분량은 쓰지 않음
  ['김치찌개', food('김치찌개', 'D306-266000000-0001', 61, null)],
]);

describe('groundCalories - 식약처 열량 + 근거 있는 무게 (확정)', () => {
  it('개수 단위면 포장 내용량 x 수량으로 환산한다. (불닭볶음면 2봉 = 1061)', () => {
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
    ).toEqual({ calories: 1061, grams: 280, estimated: false });
  });

  it('1봉 값(531)과 2봉 값(1061)을 혼동하지 않는다.', () => {
    expect(
      groundCalories({ name: '불닭볶음면', quantity: 1, unit: '봉지', estimated: true }, TABLE),
    ).toEqual({ calories: 531, grams: 140, estimated: false });
  });

  it('LLM이 부풀린 칼로리(4000)를 무시하고 DB 값으로 덮어쓴다.', () => {
    const { calories } = groundCalories(
      { name: '불닭볶음면', quantity: 2, unit: '봉지', calories: 4000, estimated: true },
      TABLE,
    );
    expect(calories).not.toBe(4000);
  });

  it('g 단위는 사용자가 말한 무게를 쓴다. (닭가슴살 삶은 것 200g = 254)', () => {
    expect(
      groundCalories(
        { name: '닭가슴살', quantity: 200, unit: 'g', gramsEstimate: 200, estimated: true },
        TABLE,
      ),
    ).toEqual({ calories: 254, grams: 200, estimated: false });
  });

  it('공백 & 대소문자가 달라도 정규화해서 찾는다.', () => {
    expect(groundCalories({ name: '불닭 볶음면', estimated: true }, TABLE).estimated).toBe(false);
  });

  it('수량이 없으면 1회 분량으로 본다', () => {
    expect(groundCalories({ name: '불닭볶음면', unit: '봉지', estimated: true }, TABLE).grams).toBe(
      140,
    );
  });
});

describe('groundCalories - 식약처 열량 + AI 무게 (추정)', () => {
  it('공식 1회 분량이 없으면 AI 가 환산한 무게를 쓰고 추정으로 표시한다 (김치찌개 400g = 244)', () => {
    expect(
      groundCalories(
        { name: '김치찌개', quantity: 1, unit: '인분', gramsEstimate: 400, estimated: true },
        TABLE,
      ),
    ).toEqual({ calories: 244, grams: 400, estimated: true });
  });

  it('무게를 전혀 알 수 없으면 LLM 칼로리로 폴백한다', () => {
    expect(
      groundCalories(
        { name: '김치찌개', quantity: 1, unit: '인분', calories: 250, estimated: true },
        TABLE,
      ),
    ).toEqual({ calories: 250, grams: undefined, estimated: true });
  });
});

describe('toMealType - 모델이 준 끼니 값 정리', () => {
  it('목록에 있는 끼니는 그대로 쓴다.', () => {
    expect(toMealType('DINNER')).toBe('DINNER');
  });

  it.each(['NONE', '', '저녁', undefined, null])('%p 는 끼니 없음으로 본다.', (raw) => {
    expect(toMealType(raw)).toBeUndefined();
  });
});

describe('groundCalories - 식약처에 없는 음식은 처음 추정값으로 고정 (추정)', () => {
  /** 처음 기록할 때 기억해 둔 값: 100g당 250kcal, 1개 300g */
  const SAVED = new Map<string, FoodEstimate>([
    ['서브웨이폴드포크30cm', { caloriesPer100g: 250, gramsPerServing: 300 }],
  ]);
  const sub = { name: '서브웨이 폴드포크 30cm', estimated: true };

  it('기억해 둔 값이 있으면 이번 AI 추정값 대신 그 값을 쓴다. (같은 메뉴가 1000/999로 갈리던 문제)', () => {
    expect(
      groundCalories(
        {
          ...sub,
          quantity: 1,
          unit: '개',
          gramsEstimate: 300,
          caloriesPer100g: 333,
          calories: 999,
        },
        TABLE,
        SAVED,
      ),
    ).toEqual({ calories: 750, grams: 300, estimated: true });
  });

  it('수량이 달라도 기억한 1개 무게로 계산한다.', () => {
    expect(groundCalories({ ...sub, quantity: 2, unit: '개' }, TABLE, SAVED)).toEqual({
      calories: 1500,
      grams: 600,
      estimated: true,
    });
  });

  it('g으로 말하면 그 무게에 기억한 열량을 곱한다.', () => {
    expect(
      groundCalories({ ...sub, quantity: 200, unit: 'g', gramsEstimate: 200 }, TABLE, SAVED),
    ).toEqual({ calories: 500, grams: 200, estimated: true });
  });

  it('식약처 값이 있으면 기억해 둔 추정값보다 우선한다.', () => {
    const wrong = new Map<string, FoodEstimate>([
      ['불닭볶음면', { caloriesPer100g: 999, gramsPerServing: 999 }],
    ]);
    expect(
      groundCalories(
        { name: '불닭볶음면', quantity: 2, unit: '봉지', estimated: true },
        TABLE,
        wrong,
      ),
    ).toEqual({ calories: 1061, grams: 280, estimated: false });
  });

  it('처음 보는 음식은 이번 추정값으로 계산하되 항상 추정으로 표시한다.', () => {
    expect(
      groundCalories(
        {
          name: '엽기떡볶이',
          quantity: 1,
          unit: '인분',
          gramsEstimate: 400,
          caloriesPer100g: 150,
          estimated: false,
        },
        TABLE,
      ),
    ).toEqual({ calories: 600, grams: 400, estimated: true });
  });
});

describe('estimateOf / newEstimates - 기억해 둘 추정값', () => {
  it('개수로 말하면 1개 무게를 함께 기억한다.', () => {
    expect(
      estimateOf({ unit: '개', quantity: 2, gramsEstimate: 600, caloriesPer100g: 249.6 }),
    ).toEqual({ caloriesPer100g: 250, gramsPerServing: 300 });
  });

  it('g으로 말하면 1개 무게는 비워 둔다.', () => {
    expect(
      estimateOf({ unit: 'g', quantity: 200, gramsEstimate: 200, caloriesPer100g: 550 }),
    ).toEqual({
      caloriesPer100g: 550,
      gramsPerServing: null,
    });
  });

  it('100g당 열량이 없으면 기억하지 않는다.', () => {
    expect(estimateOf({ unit: '개', quantity: 1, gramsEstimate: 300 })).toBeNull();
  });

  it('식약처 값도, 기억해 둔 값도 없는 이름만 고른다.', () => {
    const saved = new Map<string, FoodEstimate>([
      ['서브웨이폴드포크30cm', { caloriesPer100g: 250, gramsPerServing: 300 }],
    ]);
    const items = [
      { name: '불닭볶음면', quantity: 1, unit: '개', caloriesPer100g: 400, estimated: true },
      {
        name: '서브웨이 폴드포크 30cm',
        quantity: 1,
        unit: '개',
        caloriesPer100g: 333,
        estimated: true,
      },
      {
        name: '엽기떡볶이',
        quantity: 1,
        unit: '인분',
        gramsEstimate: 400,
        caloriesPer100g: 150,
        estimated: true,
      },
    ];

    expect(newEstimates(items, TABLE, saved)).toEqual(
      new Map([['엽기떡볶이', { caloriesPer100g: 150, gramsPerServing: 400 }]]),
    );
  });
});
