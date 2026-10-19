import { MealType, type FoodNutrition } from '@fitfoyo/database';
import { normalizeFoodName } from '../nutrition/nutrition.service';
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
 * 칼로리는 LLM 산수를 신뢰하지 않고 서버에서 재계산
 * 근거값 (100g당 kcal, 환산 그램)이 없으면 LLM 값으로 폴백
 */
function resolveCalories(item: {
  caloriesPer100g?: number;
  gramsEstimate?: number;
  calories?: number;
}): number | undefined {
  const { caloriesPer100g, gramsEstimate } = item;
  if (
    typeof caloriesPer100g === 'number' &&
    typeof gramsEstimate === 'number' &&
    caloriesPer100g >= 0 &&
    gramsEstimate > 0
  ) {
    return Math.round((caloriesPer100g * gramsEstimate) / 100);
  }
  return item.calories;
}

/**
 * 칼로리 = 100g당 열량 x 무게
 * - DB(식약처 값)에 있으면 열량은 공식 값, 무게까지 근거가 있을 때만 확정
 * - DB에 없거나 무게를 정할 수 없으면 LLM 근거값으로 재계산 폴백
 */
export function groundCalories(
  item: {
    name: string;
    unit?: string;
    quantity?: number;
    gramsEstimate?: number;
    caloriesPerr100g?: number;
    calories?: number;
    estimated: boolean;
  },
  table: Map<string, FoodNutrition>,
): { calories?: number; grams?: number; estimated: boolean } {
  const hit = table.get(normalizeFoodName(item.name));
  const weight = hit ? resolveGrams(item, hit.gramsPerServing) : null;

  if (hit && weight) {
    return {
      calories: Math.round((hit.caloriesPer100g * weight.grams) / 100),
      grams: Math.round(weight.grams),
      estimated: !weight.grounded,
    };
  }

  const grams =
    typeof item.gramsEstimate === 'number' && item.gramsEstimate > 0
      ? Math.round(item.gramsEstimate)
      : undefined;

  return { calories: resolveCalories(item), grams, estimated: item.estimated };
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
export function toDietItemInput(item: DietItem, table: Map<string, FoodNutrition>) {
  const grounded = groundCalories(item, table);
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
