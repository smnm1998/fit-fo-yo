import type { z } from 'zod';
import type {
  AiChatResponseSchema,
  ApiUserSchema,
  DailySummarySchema,
  DietItemSchema,
  ExerciseItemSchema,
  HealthProfileSchema,
  RecommendationFocusSchema,
  RecommendationSchema,
  RecordSchema,
} from '@/lib/schemas/api';

// api 응답 타입은 스키마에서 만든다 → 타입과 실제 검증이 따로 놀지 않게
export type ApiUser = z.infer<typeof ApiUserSchema>;
export type DietItem = z.infer<typeof DietItemSchema>;
export type ExerciseItem = z.infer<typeof ExerciseItemSchema>;
export type RecordDto = z.infer<typeof RecordSchema>;
export type RecommendationFocus = z.infer<typeof RecommendationFocusSchema>;
export type DailySummary = z.infer<typeof DailySummarySchema>;
export type RecommendationDto = z.infer<typeof RecommendationSchema>;
export type RecommendationPayload = RecommendationDto['payload'];
export type HealthProfileDto = z.infer<typeof HealthProfileSchema>;
export type AiChatResponse = z.infer<typeof AiChatResponseSchema>;

// BFF(서버)에서만 다루는 값 — 브라우저로 내려가지 않는다
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: ApiUser;
  tokens: AuthTokens;
};

export type AiChatTurn = { role: 'user' | 'assistant'; content: string };
