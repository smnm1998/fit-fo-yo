import type { FoodNutrition } from '@fitfoyo/database';
import { normalizeFoodName } from '../nutrition/nutrition.service';
import type { ParsedDietPayload, ParsedExercisePayload } from './schemas/function-schemas';

/** 체중 미상 사용자 기본값 (HealthProfile.weightKg가 비어 있을 때) */
export const DEFAULT_WEIGHT_KG = 65;

type DietItem = ParsedDietPayload['items'][number];
type ExerciseItem = ParsedExercisePayload['items'][number];

/** g/ml로 무게를 직접  준 경우만 LLM grams 신뢰, 아니면 DB 대표 그램수 x 수량 */
function resolveGrams(
  item: { unit?: string; quantity?: number; gramsEstimate?: number },
  gramsPerServing: number,
): number {
  const { unit, quantity, gramsEstimate } = item;
  if ((unit === 'g' || unit === 'ml') && typeof gramsEstimate === 'number' && gramsEstimate > 0) {
    return gramsEstimate;
  }
  const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  return qty * gramsPerServing;
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
 * 등록 음식이면 DB 근거값으로 확정 (estimagted=false), 미등록이면 LLM 재계산 폴백
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
): { calories?: number; grams?: number; estimated: boolean } {
  const hit = table.get(normalizeFoodName(item.name));
  if (hit) {
    const grams = resolveGrams(item, hit.gramsPerServing);
    return {
      calories: Math.round((hit.caloriesPer100g * grams) / 100),
      grams: Math.round(grams),
      estimated: false,
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

/** 파싱된 식단 아이템 -> Prisma DietItem 입력값 */
export function toDietItemInput(item: DietItem, table: Map<string, FoodNutrition>) {
  const grounded = groundCalories(item, table);
  return {
    name: item.name,
    mealType: item.mealType || undefined,
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
