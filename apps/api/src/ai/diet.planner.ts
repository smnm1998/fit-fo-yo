import type { MealType } from '@fitfoyo/database';
import { normalizeFoodName } from '../nutrition/nutrition.service';

/** 대조에 필요한 만큼만 본 "그 날의 식단 기록" */
export type DayDietRecord = {
  id: string;
  dietItems: { name: string; mealType: MealType | null }[];
};

type Incoming = { name: string; mealType?: MealType | null };

/**
 * 식단을 기록하기 전에 정하는 처리 방법
 * - CREATE: 새 기록으로 만든다.
 * - APPEND: 같은 끼니 기록에 덧붙인다.
 * - SKIP: 기록할 것이 없다. (전부 이미 있음 -> 사용자에게 되묻는다.)
 * skipped = 이미 기록되어 있어서 뺀 음식 이름
 */
export type DietPlan<T> =
  | { kind: 'CREATE'; items: T[]; skipped: string[] }
  | { kind: 'APPEND'; recordId: string; items: T[]; skipped: string[] }
  | { kind: 'SKIP'; skipped: string[] };

/** 항목들의 끼니, 끼니가 없거나 여러 끼니가 섞여 있으면 null */
function mealOf(items: { mealType?: MealType | null }[]): MealType | null {
  const meals = new Set(items.flatMap((item) => (item.mealType ? [item.mealType] : [])));
  const [only] = meals;
  return meals.size === 1 && only ? only : null;
}

/**
 * 같은 끼니인가 체크
 * 둘 다 끼니가 없으면 같은 것으로 봄 (끼니 없이 같은 음식을 두 번 말한 경우)
 */
function sameMeal(a?: MealType | null, b?: MealType | null): boolean {
  return (a ?? null) === (b ?? null);
}

function alreadyRecorded(day: DayDietRecord[], item: Incoming): boolean {
  const key = normalizeFoodName(item.name);
  return day.some((record) =>
    record.dietItems.some(
      (saved) => normalizeFoodName(saved.name) === key && sameMeal(saved.mealType, item.mealType),
    ),
  );
}

/**
 * 그 날의 식단과 새로 들어온 음식을 대조한다.
 * - 이미 있는 음식(Incoming)을 뺀다. 단, again(사용자가 "하나 더"라고 함)이면 빼지 않는다.
 * - 남은 음식은 같은 끼니 기록이 있으면 거기에 붙이고, 없으면 새 기록으로 만든다.
 */
export function planDiet<T extends Incoming>(
  day: DayDietRecord[],
  incoming: T[],
  again: boolean,
): DietPlan<T> {
  const items = again ? incoming : incoming.filter((item) => !alreadyRecorded(day, item));
  const skipped = incoming.filter((item) => !items.includes(item)).map((item) => item.name);

  if (items.length === 0) return { kind: 'SKIP', skipped };

  const meal = mealOf(items);
  const target = meal ? day.find((record) => mealOf(record.dietItems) === meal) : undefined;

  return target
    ? { kind: 'APPEND', recordId: target.id, items, skipped }
    : { kind: 'CREATE', items, skipped };
}
