import type { MealType } from '@fitfoyo/database';
import { planDiet, type DayDietRecord } from './diet.planner';

/** 이미 저장된 식단 기록 */
function saved(id: string, mealType: MealType | null, ...names: string[]): DayDietRecord {
  return { id, dietItems: names.map((name) => ({ name, mealType })) };
}

/** 모델이 새로 보낸 음식 */
function food(name: string, mealType?: MealType) {
  return { name, mealType };
}

describe('planDiet - 같은 끼니에 덧붙이기', () => {
  it('끼니 전체를 다시 보내도 새 음식만 기존 기록에 붙인다. (샐러드 중복 기록 회귀)', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드')];
    const rice = food('쌀밥', 'LUNCH');

    expect(planDiet(day, [food('닭가슴살 샐러드', 'LUNCH'), rice], false)).toEqual({
      kind: 'APPEND',
      recordId: 'lunch',
      items: [rice],
      skipped: ['닭가슴살 샐러드'],
    });
  });

  it('새 음식만 보내면 그대로 같은 끼니 기록에 붙인다.', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드')];
    const rice = food('쌀밥', 'LUNCH');

    expect(planDiet(day, [rice], false)).toEqual({
      kind: 'APPEND',
      recordId: 'lunch',
      items: [rice],
      skipped: [],
    });
  });

  it('다른 끼니면 새 기록으로 만든다.', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드')];

    expect(planDiet(day, [food('쌀밥', 'DINNER')], false).kind).toBe('CREATE');
  });

  it('끼니를 말하지 않은 음식은 어느 기록에도 붙이지 않는다.', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드')];

    expect(planDiet(day, [food('쌀밥')], false).kind).toBe('CREATE');
  });
});

describe('planDiet - 이미 기록된 음식', () => {
  it('같은 음식을 다시 보내면 기록하지 않는다. (같은 문장을 두 번 보낸 경우)', () => {
    const day = [saved('r1', null, '불닭볶음면')];

    expect(planDiet(day, [food('불닭볶음면')], false)).toEqual({
      kind: 'SKIP',
      skipped: ['불닭볶음면'],
    });
  });

  it('again 이면 한 번 더 기록한다.', () => {
    const day = [saved('r1', null, '불닭볶음면')];
    const again = food('불닭볶음면');

    expect(planDiet(day, [again], true)).toEqual({ kind: 'CREATE', items: [again], skipped: [] });
  });

  it('같은 끼니의 "하나 더"는 그 끼니 기록에 붙인다.', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드', '김치')];
    const kimchi = food('김치', 'LUNCH');

    expect(planDiet(day, [kimchi], true)).toEqual({
      kind: 'APPEND',
      recordId: 'lunch',
      items: [kimchi],
      skipped: [],
    });
  });

  it('끼니가 다르게 적혀 있으면 같은 음식이어도 중복이 아니다.', () => {
    const day = [saved('lunch', 'LUNCH', '김치찌개')];

    expect(planDiet(day, [food('김치찌개', 'DINNER')], false).kind).toBe('CREATE');
  });

  it('한쪽에 끼니가 없으면 이름만으로 비교한다.', () => {
    const day = [saved('lunch', 'LUNCH', '김치찌개')];

    expect(planDiet(day, [food('김치찌개')], false).kind).toBe('SKIP');
  });

  it('띄어쓰기만 다른 이름은 같은 음식으로 본다.', () => {
    const day = [saved('lunch', 'LUNCH', '닭가슴살 샐러드')];

    expect(planDiet(day, [food('닭가슴살샐러드', 'LUNCH')], false).kind).toBe('SKIP');
  });

  it('보낸 음식이 없으면 아무것도 하지 않는다.', () => {
    expect(planDiet([], [], false)).toEqual({ kind: 'SKIP', skipped: [] });
  });
});
