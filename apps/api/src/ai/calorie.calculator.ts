import { MealType, type FoodNutrition } from '@fitfoyo/database';
import { normalizeFoodName, type FoodEstimate } from '../nutrition/nutrition.service';
import type { ParsedDietPayload, ParsedExercisePayload } from './schemas/function-schemas';

/** 체중 미상 사용자 기본값 (HealthProfile.weightKg가 비어 있을 때) */
export const DEFAULT_WEIGHT_KG = 65;

type DietItem = ParsedDietPayload['items'][number];
type ExerciseItem = ParsedExercisePayload['items'][number];

/**
 * 계산에 쓸 무게(g)와 그 무게에 근거가 있는지,
 * 1) 단위가 g/ml 이면 사용자가 말한 무게 (근거 있음)
 * 2) 공식 1회 분량(포장 내용량)이 있으면 수량 x 1회 분량 (근거 있음)
 * 3) 둘 다 없으면 LLM이 환산한 그램 (근거 없음)
 */
function resolveGrams(
  item: { unit?: string; quantity?: number; gramsEstimate?: number },
  gramsPerServing: number | null,
): { grams: number; grounded: boolean } | null {
  const { unit, quantity, gramsEstimate } = item;
  const estimate = typeof gramsEstimate === 'number' && gramsEstimate > 0 ? gramsEstimate : null;

  if ((unit === 'g' || unit === 'ml') && estimate !== null) {
    return { grams: estimate, grounded: true };
  }

  if (gramsPerServing !== null) {
    const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    return { grams: qty * gramsPerServing, grounded: true };
  }
  return estimate !== null ? { grams: estimate, grounded: false } : null;
}

/**
 * 이번 주 AI 추정값에서 기억해 둘 값
 * - 100g당 열량 (정수로 저장하므로 반올림)
 * - 1개(1인분) 무게: 개수로 말했을 때만, g/ml로 말했으면 1개 무게를 알 수 없음
 */
export function estimateOf(item: {
  unit?: string;
  quantity?: number;
  gramsEstimate?: number;
  caloriesPer100g?: number;
}): FoodEstimate | null {
  const { unit, quantity, gramsEstimate, caloriesPer100g } = item;
  if (typeof caloriesPer100g !== 'number' || caloriesPer100g < 0) return null;

  const byCount = unit !== 'g' && unit !== 'ml';
  const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  const gramsPerServing =
    byCount && typeof gramsEstimate === 'number' && gramsEstimate > 0
      ? Math.round(gramsEstimate / qty)
      : null;

  return { caloriesPer100g: Math.round(caloriesPer100g), gramsPerServing };
}

/** 이번 요청에서 처음 추정한 음식들 (식약처 값도, 기억해 둔 추정값도 없는 이름) */
export function newEstimates(
  items: DietItem[],
  table: Map<string, FoodNutrition>,
  estimates: Map<string, FoodEstimate>,
): Map<string, FoodEstimate> {
  const fresh = new Map<string, FoodEstimate>();
  for (const item of items) {
    const key = normalizeFoodName(item.name);
    if (table.has(key) || estimates.has(key) || fresh.has(key)) continue;
    const guess = estimateOf(item);
    if (guess) fresh.set(key, guess);
  }
  return fresh;
}

/**
 * 칼로리 = 100g 당 열량 x 무게
 * 1) 식약처 값이 있으면 그 열량, 무게까지 근거가 있을 때만 확정
 * 2) 없으면 기억해 둔 추정값, 그것도 없으면 이번 AI 추정값, 항상 '추정'
 * 3) 열량이나 무게를 정할 수 없으면 AI가 준 총칼로리를 그대로
 */
export function groundCalories(
  item: {
    name: string;
    unit?: string;
    quantity?: number;
    gramsEstimate?: number;
    caloriesPer100g?: number;
    calories?: number;
    estimated: boolean;
  },
  table: Map<string, FoodNutrition>,
  estimates: Map<string, FoodEstimate> = new Map(),
): { calories?: number; grams?: number; estimated: boolean } {
  const key = normalizeFoodName(item.name);
  const hit = table.get(key);
  const official = hit ? resolveGrams(item, hit.gramsPerServing) : null;
  if (hit && official) {
    return {
      calories: Math.round((hit.caloriesPer100g * official.grams) / 100),
      grams: Math.round(official.grams),
      estimated: !official.grounded,
    };
  }

  const guess = hit ? null : (estimates.get(key) ?? estimateOf(item));
  const weight = guess ? resolveGrams(item, guess.gramsPerServing) : null;
  if (guess && weight) {
    return {
      calories: Math.round((guess.caloriesPer100g * weight.grams) / 100),
      grams: Math.round(weight.grams),
      estimated: true,
    };
  }

  const grams =
    typeof item.gramsEstimate === 'number' && item.gramsEstimate > 0
      ? Math.round(item.gramsEstimate)
      : undefined;

  return { calories: item.calories, grams, estimated: item.estimated };
}

/** 소모 칼로리 = MET x 3.5 x 체중(kg) / 200 x 분 */
export function resolveCaloriesBurned(
  item: {
    met?: number;
    durationMinutes?: number;
    caloriesBurned?: number;
  },
  weightKg: number,
): number | undefined {
  const { met, durationMinutes } = item;
  if (
    typeof met === 'number' &&
    typeof durationMinutes === 'number' &&
    met > 0 &&
    durationMinutes > 0
  ) {
    return Math.round(((met * 3.5 * weightKg) / 200) * durationMinutes);
  }
  return item.caloriesBurned;
}

const MEAL_TYPES = new Set<string>(Object.values(MealType));

/**
 * 모델이 준 끼니 값을 정리
 * 'NONE(말하지 않음), 빈 값, 목록에 없는 값은 모두 "끼니 없음"
 */
export function toMealType(raw: string | null | undefined): MealType | undefined {
  return raw && MEAL_TYPES.has(raw) ? (raw as MealType) : undefined;
}

/** 파생된 식단 아이템 -> Prisma DietItem 입력값 */
export function toDietItemInput(
  item: DietItem,
  table: Map<string, FoodNutrition>,
  estimates: Map<string, FoodEstimate> = new Map(),
) {
  const grounded = groundCalories(item, table, estimates);
  return {
    name: item.name,
    mealType: toMealType(item.mealType),
    quantity: item.quantity,
    unit: item.unit,
    grams: grounded.grams,
    calories: grounded.calories,
    carbs: item.carbs,
    protein: item.protein,
    fat: item.fat,
    estimated: grounded.estimated,
  };
}

/** 파싱된 운동 아이템 -> Prisma ExerciseItem 입력값 */
export function toExerciseItemInput(item: ExerciseItem, weightKg: number) {
  return {
    name: item.name,
    durationMinutes: item.durationMinutes,
    intensity: item.intensity,
    caloriesBurned: resolveCaloriesBurned(item, weightKg),
    estimated: item.estimated,
  };
}
