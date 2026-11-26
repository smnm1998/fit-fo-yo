import { z } from 'zod';

/**
 * BFF가 돌려주는 응답의 실제 모양
 * 타입 단언(as T)은 컴파일할 때만 있고 실행 중엔 아무것도 확인하지 않는다 -> 응답은 여기서 확인한다.
 * 스키마에 없는 필드를 버린다.
 */

/** Prisma DateTime이 JSON으로 바뀐 값 (예: '2026-11-24T03:00:00.000Z') */
const isoDateTime = z.iso.datetime();

export const ApiUserSchema = z.object({
  id: z.string(),
  email: z.string().nullish(),
  nickname: z.string().nullish(),
  isGuest: z.boolean(),
  createdAt: isoDateTime,
});

export const DietItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  mealType: z.string().nullish(),
  quantity: z.number().nullish(),
  unit: z.string().nullish(),
  grams: z.number().nullish(),
  calories: z.number().nullish(),
  carbs: z.number().nullish(),
  protein: z.number().nullish(),
  fat: z.number().nullish(),
  estimated: z.boolean(),
});

export const ExerciseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number().nullish(),
  intensity: z.string().nullish(),
  caloriesBurned: z.number().nullish(),
  estimated: z.boolean(),
});

export const RecordSchema = z.object({
  id: z.string(),
  type: z.enum(['DIET', 'EXERCISE']),
  rawInput: z.string(),
  recordedAt: isoDateTime,
  createdAt: isoDateTime,
  dietItems: z.array(DietItemSchema),
  exerciseItems: z.array(ExerciseItemSchema),
});

export const RecordListSchema = z.array(RecordSchema);

/** GET /records (페이지 단위 목록, total = 조건에 맞는 전체 건수) */
export const RecordPageSchema = z.object({
  items: RecordListSchema,
  total: z.number().int().nonnegative(),
});

export const RecommendationFocusSchema = z.enum(['diet', 'exercise', 'balanced']);

export const DailySummarySchema = z.object({
  totalCalories: z.number(),
  carbs: z.number(),
  protein: z.number(),
  fat: z.number(),
  exerciseMinutes: z.number(),
  caloriesBurned: z.number(),
  dietCount: z.number(),
  exerciseCount: z.number(),
});

export const RecommendationSchema = z.object({
  id: z.string(),
  forDate: isoDateTime,
  payload: z.object({
    message: z.string(),
    focus: RecommendationFocusSchema,
    summary: DailySummarySchema,
  }),
});

export const RecommendationListSchema = z.array(RecommendationSchema);

/** GET /api/month (BFF가 기록과 추천을 한 번에 모은 것) */
export const MonthDataSchema = z.object({
  records: RecordListSchema,
  recommendations: RecommendationListSchema,
});

export const HealthProfileSchema = z.object({
  id: z.string(),
  heightCm: z.number().nullish(),
  weightKg: z.number().nullish(),
  conditions: z.string().nullish(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const AuthResultSchema = z.object({ user: ApiUserSchema });

export const OkSchema = z.object({ ok: z.boolean() });

/** 204 No Content: 본문이 없어 request()에서 null이 된다 */
export const NoContentSchema = z.null();

export const AiChatResponseSchema = z.object({
  reply: z.string(),
  suggestions: z.array(z.string()),
  mutations: z.object({
    created: RecordListSchema,
    updated: RecordListSchema,
    deletedIds: z.array(z.string()),
  }),
});
