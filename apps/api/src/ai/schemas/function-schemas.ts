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
    quantity: { type: 'number', description: '사용자 표현 기준 수량 (예: 1, 200)' },
    unit: {
      type: 'string',
      enum: ['g', 'ml', '개', '공기', '인분', '컵', '조각', '스푼'],
      description: '수량 단위. 사용자 표현에 가장 가까운 것.',
    },
    gramsEstimate: {
      type: 'number',
      description: '위 수량을 그램(g)으로 환산한 값. 예: 김치찌개 1인분 → 400',
    },
    caloriesPer100g: {
      type: 'number',
      description: '해당 음식 100g당 칼로리(kcal). 일반적인 조리 기준.',
    },
    calories: {
      type: 'integer',
      description:
        '총 칼로리. 반드시 round(caloriesPer100g × gramsEstimate / 100) 과 일치해야 합니다.',
    },
    carbs: { type: 'number', description: '탄수화물 (g)' },
    protein: { type: 'number', description: '단백질 (g)' },
    fat: { type: 'number', description: '지방 (g)' },
    estimated: {
      type: 'boolean',
      description: 'AI가 추정한 값이면 true, 사용자가 명시한 값 기반이면 false',
    },
  },
  required: [
    'name',
    'quantity',
    'unit',
    'gramsEstimate',
    'caloriesPer100g',
    'calories',
    'estimated',
  ],
  additionalProperties: false,
} as const;

const exerciseItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '운동명' },
    durationMinutes: { type: 'integer', description: '운동 시간 (분)' },
    intensity: {
      type: 'string',
      enum: ['가볍게', '적당히', '격하게'],
      description: '강도',
    },
    met: {
      type: 'number',
      description: '운동 강도 계수(MET). 예: 걷기 3.5, 조깅 7, 달리기 10, 웨이트 5, 수영 8',
    },
    caloriesBurned: {
      type: 'integer',
      description:
        '소모 칼로리. 반드시 round(met × 3.5 × 65 / 200 × durationMinutes) 과 일치 (체중 65kg 가정).',
    },
    estimated: {
      type: 'boolean',
      description: 'AI가 추정한 값이면 true, 사용자가 명시한 값 기반이면 false',
    },
  },
  required: ['name', 'durationMinutes', 'met', 'caloriesBurned', 'estimated'],
  additionalProperties: false,
} as const;

const recordDietTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'record_diet',
    description: '사용자가 식단/음식 섭취를 기록하려고 할 때 호출합니다.',
    parameters: {
      type: 'object',
      properties: {
        items: { type: 'array', description: '섭취한 음식 항목들', items: dietItemSchema },
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
};

const recordExerciseTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'record_exercise',
    description: '사용자가 운동을 기록하려고 할 때 호출합니다.',
    parameters: {
      type: 'object',
      properties: {
        items: { type: 'array', description: '수행한 운동 항목들', items: exerciseItemSchema },
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
};

const recordInvalidDomainTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'record_invalid_domain',
    description: '입력이 식단/운동 헬스케어 도메인 밖일 때 호출합니다.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: '간단한 이유 (예: "일상 잡담", "코딩 질문")' },
      },
      required: ['reason'],
      additionalProperties: false,
    },
  },
};

const updateRecordTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'update_record',
    description:
      '기존 기록을 수정할 때 호출합니다. recordId는 "이 날의 기록" 컨텍스트의 id를 사용하세요. ' +
      '식단이면 dietItems를, 운동이면 exerciseItems를 "수정 후의 전체 항목"으로 채웁니다.',
    parameters: {
      type: 'object',
      properties: {
        recordId: { type: 'string', description: '수정할 기록의 id' },
        dietItems: {
          type: 'array',
          description: '식단 기록일 때: 수정 후 음식 항목 전체',
          items: dietItemSchema,
        },
        exerciseItems: {
          type: 'array',
          description: '운동 기록일 때: 수정 후 운동 항목 전체',
          items: exerciseItemSchema,
        },
        recordedAt: { type: 'string', format: 'date-time', description: '시각 변경 시에만' },
      },
      required: ['recordId'],
      additionalProperties: false,
    },
  },
};

const deleteRecordTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'delete_record',
    description:
      '기존 기록을 삭제할 때 호출합니다. recordId는 "이 날의 기록" 컨텍스트의 id를 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        recordId: { type: 'string', description: '삭제할 기록의 id' },
      },
      required: ['recordId'],
      additionalProperties: false,
    },
  },
};

/** 레거시 단발 파싱(parse-and-save)용 */
export const PARSE_RECORD_TOOLS: ChatCompletionTool[] = [
  recordDietTool,
  recordExerciseTool,
  recordInvalidDomainTool,
];

/** 대화형 에이전트용: 생성 + 수정 + 삭제 (도메인 이탈은 자연어로 처리하므로 invalid_domain 제외) */
export const CHAT_AGENT_TOOLS: ChatCompletionTool[] = [
  recordDietTool,
  recordExerciseTool,
  updateRecordTool,
  deleteRecordTool,
];

export type ParsedDietPayload = {
  items: Array<{
    name: string;
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    quantity?: number;
    unit?: string;
    gramsEstimate?: number;
    caloriesPer100g?: number;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    estimated: boolean;
  }>;
  recordedAt?: string;
};

export type ParsedExercisePayload = {
  items: Array<{
    name: string;
    durationMinutes?: number;
    intensity?: string;
    met?: number;
    caloriesBurned?: number;
    estimated: boolean;
  }>;
  recordedAt?: string;
};

export type ParsedResult =
  | { kind: 'diet'; payload: ParsedDietPayload }
  | { kind: 'exercise'; payload: ParsedExercisePayload }
  | { kind: 'invalid_domain'; reason: string };

export type UpdateRecordPayload = {
  recordId: string;
  dietItems?: ParsedDietPayload['items'];
  exerciseItems?: ParsedExercisePayload['items'];
  recordedAt?: string;
};

export type DeleteRecordPayload = { recordId: string };
