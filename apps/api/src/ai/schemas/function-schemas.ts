import type { ChatCompletionTool } from 'openai/resources/chat/completions';

const dietItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '음식명' },
    mealType: {
      type: 'string',
      enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
      description: '식사 시점',
    },
    quantity: { type: 'number', description: '수량 (예: 200)' },
    unit: { type: 'string', description: '단위 (예: g, ml, 개)' },
    calories: { type: 'integer', description: '칼로리 (kcal)' },
    carbs: { type: 'number', description: '탄수화물 (g)' },
    protein: { type: 'number', description: '단백질 (g)' },
    fat: { type: 'number', description: '지방 (g)' },
  },
  required: ['name'],
  additionalProperties: false,
} as const;

const exerciseItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '운동명' },
    durationMinutes: { type: 'integer', description: '운동 시간 (분)' },
    intensity: {
      type: 'string',
      description: '강도 (예: 가볍게, 적당히, 격하게)',
    },
    caloriesBurned: { type: 'integer', description: '소모 칼로리 (kcal)' },
  },
  required: ['name'],
  additionalProperties: false,
} as const;

export const PARSE_RECORD_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'record_diet',
      description: '사용자가 식단/음식 섭취를 기록하려고 할 때 호출합니다.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: '섭취한 음식 항목들',
            items: dietItemSchema,
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO8601 시각. 추론 불가하면 생략.',
          },
        },
        required: ['items'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_exercise',
      description: '사용자가 운동을 기록하려고 할 때 호출합니다.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: '수행한 운동 항목들',
            items: exerciseItemSchema,
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO8601 시각. 추론 불가하면 생략.',
          },
        },
        required: ['items'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_invalid_domain',
      description: '입력이 식단/운동 헬스케어 도메인 밖일 때 호출합니다.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: '간단한 이유 (예: "일상 잡담", "코딩 질문")',
          },
        },
        required: ['reason'],
        additionalProperties: false,
      },
    },
  },
];

export type ParsedDietPayload = {
  items: Array<{
    name: string;
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    quantity?: number;
    unit?: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  }>;
  recordedAt?: string;
};

export type ParsedExercisePayload = {
  items: Array<{
    name: string;
    durationMinutes?: number;
    intensity?: string;
    caloriesBurned?: number;
  }>;
  recordedAt?: string;
};

export type ParsedResult =
  | { kind: 'diet'; payload: ParsedDietPayload }
  | { kind: 'exercise'; payload: ParsedExercisePayload }
  | { kind: 'invalid_domain'; reason: string };
