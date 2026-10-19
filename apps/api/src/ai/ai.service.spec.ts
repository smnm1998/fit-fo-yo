import { Test } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RecordType } from '@fitfoyo/database';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsService } from '../records/records.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { HealthProfileService } from '../health-profile/health-profile.service';

/** OpenAI chat.completions tool_call 응답을 흉내내는 헬퍼 */
function toolCallResponse(name: string, args: unknown) {
  return {
    choices: [
      {
        message: {
          tool_calls: [{ type: 'function', function: { name, arguments: JSON.stringify(args) } }],
        },
      },
    ],
  };
}

describe('AiService', () => {
  let service: AiService;
  let openai: { chatWithTools: jest.Mock; chat: jest.Mock };
  let records: { createFromParsed: jest.Mock; findAll: jest.Mock; appendDietItems: jest.Mock };
  let nutrition: { lookupMany: jest.Mock };
  let healthProfile: { get: jest.Mock };

  beforeEach(async () => {
    openai = { chatWithTools: jest.fn(), chat: jest.fn() };
    records = {
      createFromParsed: jest.fn((x) => Promise.resolve({ id: 'rec_1', ...x })),
      findAll: jest.fn().mockResolvedValue({ items: [] }),
      appendDietItems: jest.fn((_userId, id, items) =>
        Promise.resolve({ id, dietItems: items, exerciseItems: [] }),
      ),
    };

    nutrition = { lookupMany: jest.fn().mockResolvedValue(new Map()) };
    healthProfile = { get: jest.fn().mockResolvedValue(null) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OpenAIClient, useValue: openai },
        { provide: RecordsService, useValue: records },
        { provide: NutritionService, useValue: nutrition },
        {
          provide: PrismaService,
          useValue: { user: { findUnique: jest.fn(), update: jest.fn() } },
        },
        { provide: HealthProfileService, useValue: healthProfile },
      ],
    }).compile();

    service = moduleRef.get(AiService);
  });

  describe('날짜 컨텍스트', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date('2026-09-12T01:00:00.000Z') });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function systemPrompt(): string {
      const arg = openai.chatWithTools.mock.calls[0]?.[0] as { system: string };
      return arg.system;
    }

    it('오늘 보고 있는 날짜를 KST로 시스템 프롬프트에 싣는다.', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_exercise', {
          items: [{ name: '조깅', durationMinutes: 30, met: 7, estimated: true }],
        }),
      );

      await service.parseAndSave({
        userId: 'u1',
        rawInput: '어제 30분 조깅',
        fallbackRecordedAt: '2026-09-10T03:00:00.000Z',
      });

      expect(systemPrompt()).toContain('오늘 (KST): 2026-09-12 (토)');
      expect(systemPrompt()).toContain('보고 있는 날짜: 2026-09-10 (목)');
    });

    it('선택 날짜가 없으면 보고 있는 날짜도 오늘로 채운다.', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [{ name: '비빔밥', calories: 600, estimated: true }],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '비빔밥' });

      expect(systemPrompt()).toContain('오늘 (KST): 2026-09-12 (토)');
      expect(systemPrompt()).toContain('보고 있는 날짜: 2026-09-12 (토)');
    });
  });

  describe('운동 소모 칼로리 - 체중 반영', () => {
    function joggingCall() {
      return toolCallResponse('record_exercise', {
        items: [
          { name: '조깅', durationMinutes: 30, met: 7, caloriesBurned: 9999, estimated: true },
        ],
      });
    }

    function savedCaloriesBurned(): number | undefined {
      const arg = records.createFromParsed.mock.calls[0]?.[0] as {
        exerciseItems: { caloriesBurned?: number };
      };
      return arg.exerciseItems[0]?.caloriesBurned;
    }

    it('프로필 체중이 있으면 그 체중으로 계산한다.', async () => {
      healthProfile.get.mockResolvedValue({ weightKg: 70 });
      openai.chatWithTools.mockResolvedValue(joggingCall());

      await service.parseAndSave({ userId: 'u1', rawInput: '30분 조깅' });

      expect(savedCaloriesBurned()).toBe(257);
    });

    it('프로필이 없으면 기본 체중 65kg으로 게산한다.', async () => {
      healthProfile.get.mockResolvedValue(null);
      openai.chatWithTools.mockResolvedValue(joggingCall());

      await service.parseAndSave({ userId: 'u1', rawInput: '30분 조깅' });

      expect(savedCaloriesBurned()).toBe(239);
    });

    it('식단만 있으면 프로필을 조회하지 않는다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [{ name: '비빔밥', calories: 600, estimated: true }],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '비빔밥' });

      expect(healthProfile.get).not.toHaveBeenCalled();
    });
  });

  describe('parse', () => {
    it('record_diet tool_call 을 diet 결과로 분류한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [{ name: '닭가슴살', calories: 330, estimated: true }],
        }),
      );

      const result = await service.parse('닭가슴살 한 그릇');
      const [first] = result;
      expect(first?.kind).toBe('diet');
      if (first?.kind === 'diet') {
        expect(first.payload.items[0]?.name).toBe('닭가슴살');
      }
    });

    it('record_exercise tool_call 을 exercise 결과로 분류한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_exercise', {
          items: [{ name: '러닝', durationMinutes: 30, estimated: true }],
        }),
      );

      const result = await service.parse('30분 러닝');
      expect(result[0]?.kind).toBe('exercise');
    });

    it('record_invalid_domain 은 invalid_domain + reason 으로 분류한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_invalid_domain', { reason: '일상 잡담' }),
      );

      const [first] = await service.parse('내일 날씨 어때?');
      expect(first?.kind).toBe('invalid_domain');
      if (first?.kind === 'invalid_domain') {
        expect(first.reason).toBe('일상 잡담');
      }
    });

    it('tool_call 이 없으면 InternalServerErrorException', async () => {
      openai.chatWithTools.mockResolvedValue({ choices: [{ message: {} }] });

      await expect(service.parse('아무거나')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('parseAndSave', () => {
    it('invalid_domain 은 INVALID_DOMAIN BadRequestException 을 던지고 저장하지 않는다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_invalid_domain', { reason: '코딩 질문' }),
      );

      await expect(
        service.parseAndSave({ userId: 'u1', rawInput: 'for문 어떻게 써?' }),
      ).rejects.toThrow(BadRequestException);
      expect(records.createFromParsed).not.toHaveBeenCalled();
    });

    it('diet 저장 시 빈 mealType("") 은 undefined 로 정규화한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [{ name: '닭가슴살', mealType: '', calories: 330, estimated: true }],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '닭가슴살' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.type).toBe(RecordType.DIET);
      expect(arg.dietItems[0].mealType).toBeUndefined(); // "" → undefined
      expect(arg.rawInput).toBe('닭가슴살'); // 원본 보존 (security.md)
    });

    it('exercise 저장 시 type=EXERCISE + estimated 매핑', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_exercise', {
          items: [{ name: '러닝', durationMinutes: 30, caloriesBurned: 250, estimated: true }],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '30분 러닝' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.type).toBe(RecordType.EXERCISE);
      expect(arg.exerciseItems[0].estimated).toBe(true);
    });

    it('AI 가 recordedAt 안 주면 fallback 을 사용한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [{ name: '사과', estimated: true }],
        }),
      );

      await service.parseAndSave({
        userId: 'u1',
        rawInput: '사과',
        fallbackRecordedAt: '2026-05-31T08:00:00+09:00',
      });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.recordedAt).toEqual(new Date('2026-05-31T08:00:00+09:00'));
    });
  });

  describe('칼로리 재계산 / grounding', () => {
    it('미등록 음식은 caloriesPer100g × gramsEstimate 로 재계산한다 (LLM 폴백)', async () => {
      // lookupMany 기본 mock = 빈 Map → 폴백 경로
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [
            {
              name: '수제김치찌개', // 시드에 없는 이름
              quantity: 1,
              unit: '인분',
              gramsEstimate: 400,
              caloriesPer100g: 55,
              calories: 999, // LLM 이 잘못 계산한 값
              estimated: true,
            },
          ],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '수제김치찌개' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.dietItems[0].calories).toBe(220); // 55 × 400 / 100
      expect(arg.dietItems[0].estimated).toBe(true); // 폴백이라 추정 유지
    });

    it('등록 음식(개/봉지)은 DB 근거값 × 수량 으로 grounding 한다 (불닭 4000→1061)', async () => {
      // 실제 시드값: 불닭볶음면 { caloriesPer100g: 408, gramsPerServing: 130 }
      nutrition.lookupMany.mockResolvedValue(
        new Map([
          [
            '불닭볶음면',
            {
              name: '불닭볶음면',
              foodCd: 'P108-009000400-0210',
              caloriesPer100g: 379,
              gramsPerServing: 140,
            },
          ],
        ]),
      );
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [
            {
              name: '불닭볶음면',
              quantity: 2,
              unit: '개',
              gramsEstimate: 550, // LLM 이 라면 기준으로 잘못 준 그램수
              caloriesPer100g: 700, // LLM 환각
              calories: 4000, // 무시되어야 함
              estimated: true,
            },
          ],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '불닭볶음면 2개' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.dietItems[0].calories).toBe(1061);
      expect(arg.dietItems[0].grams).toBe(280); // 2봉 × 140g
      expect(arg.dietItems[0].estimated).toBe(false);
    });

    it('등록 음식을 g/ml 로 주면 사용자 그램수 × DB 밀도 로 계산한다', async () => {
      // 식약처 원재료 R209-008000546-0000 닭고기_가슴(껍질 제거)_삶은것: 127kcal/100g
      nutrition.lookupMany.mockResolvedValue(
        new Map([
          [
            '닭가슴살',
            {
              name: '닭가슴살',
              foodCd: 'R209-008000546-0000',
              caloriesPer100g: 127,
              gramsPerServing: null,
            },
          ],
        ]),
      );

      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [
            {
              name: '닭가슴살',
              quantity: 200,
              unit: 'g',
              gramsEstimate: 200, // 무게 직접 지정 → g 분기에서 신뢰
              caloriesPer100g: 999, // LLM 값은 무시, DB 127 사용
              calories: 1998,
              estimated: true,
            },
          ],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '닭가슴살 200g' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.dietItems[0].calories).toBe(254); // 127 × 200 / 100
      expect(arg.dietItems[0].estimated).toBe(false);
    });
  });

  describe('chat - 식단을 기록하기 전에 그 날 기록과 대조한다', () => {
    /** 이미 저장된 식단 기록 (records.findAll 이 돌려주는 모양) */
    function savedDiet(
      id: string,
      mealType: string | null,
      ...items: Array<{ name: string; quantity?: number; unit?: string; calories?: number }>
    ) {
      return {
        id,
        type: RecordType.DIET,
        dietItems: items.map((item) => ({ ...item, mealType })),
        exerciseItems: [],
      };
    }

    /** 1차 호출은 record_diet 툴 호출, 2차 호출은 JSON 응답을 돌려주게 한다 */
    function mockRecordDiet(args: unknown) {
      openai.chat
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: { name: 'record_diet', arguments: JSON.stringify(args) },
                  },
                ],
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ reply: '응답', suggestions: [] }) } }],
        });
    }

    /** n번째 openai.chat 호출에 넘어간 메시지들 */
    function sentMessages(call: number): Array<{ role: string; content: string }> {
      const arg = openai.chat.mock.calls[call]?.[0] as {
        messages: Array<{ role: string; content: string }>;
      };
      return arg.messages;
    }

    /** 2차 응답을 만드는 모델에게 넘어간 툴 실행 결과 */
    function toolResult(): string {
      return sentMessages(1).find((m) => m.role === 'tool')?.content ?? '';
    }

    function say(content: string) {
      return service.chat({ userId: 'u1', messages: [{ role: 'user', content }] });
    }

    it('같은 음식을 다시 말하면 기록하지 않고, 이미 있다는 사실을 2차 응답에 넘긴다.', async () => {
      records.findAll.mockResolvedValue({
        items: [savedDiet('lunch', 'LUNCH', { name: '불닭볶음면', quantity: 2, unit: '개' })],
      });
      mockRecordDiet({
        items: [
          { name: '불닭볶음면', mealType: 'LUNCH', quantity: 2, unit: '개', estimated: true },
        ],
        again: false,
      });

      const result = await say('불닭볶음면 2개 점심에 먹음');

      expect(records.createFromParsed).not.toHaveBeenCalled();
      expect(records.appendDietItems).not.toHaveBeenCalled();
      expect(result.mutations.created).toHaveLength(0);
      expect(toolResult()).toContain('이미 기록돼 있어 넣지 않은 항목: 불닭볶음면');
    });

    it('again 이면 같은 음식도 한 번 더 기록한다.', async () => {
      records.findAll.mockResolvedValue({ items: [savedDiet('r1', null, { name: '불닭볶음면' })] });
      mockRecordDiet({
        items: [{ name: '불닭볶음면', quantity: 2, unit: '개', estimated: true }],
        again: true,
      });

      const result = await say('응, 한 번 더 추가해줘');

      expect(records.createFromParsed).toHaveBeenCalledTimes(1);
      expect(result.mutations.created).toHaveLength(1);
    });

    it('같은 끼니에 더하면 새 기록을 만들지 않고 새 음식만 기존 기록에 붙인다. (샐러드 중복 기록 회귀)', async () => {
      records.findAll.mockResolvedValue({
        items: [savedDiet('lunch', 'LUNCH', { name: '닭가슴살 샐러드' })],
      });
      // 모델이 끼니 전체를 다시 보낸 상황
      mockRecordDiet({
        items: [
          { name: '닭가슴살 샐러드', mealType: 'LUNCH', estimated: true },
          { name: '쌀밥', mealType: 'LUNCH', estimated: true },
        ],
        again: false,
      });

      const result = await say('점심에 밥도 추가해줘');

      const [userId, recordId, items, rawInput] = records.appendDietItems.mock.calls[0] as [
        string,
        string,
        Array<{ name: string }>,
        string,
      ];
      expect(records.createFromParsed).not.toHaveBeenCalled();
      expect(userId).toBe('u1');
      expect(recordId).toBe('lunch');
      expect(items.map((i) => i.name)).toEqual(['쌀밥']);
      expect(rawInput).toBe('점심에 밥도 추가해줘');
      expect(result.mutations.updated).toHaveLength(1);
    });

    it('끼니 없이 기록된 음식이 있어도, 끼니를 말한 같은 음식은 묻지 않고 기록한다.', async () => {
      records.findAll.mockResolvedValue({ items: [savedDiet('r1', null, { name: '불닭볶음면' })] });
      mockRecordDiet({
        items: [
          { name: '불닭볶음면', mealType: 'LUNCH', quantity: 2, unit: '개', estimated: true },
        ],
        again: false,
      });

      const result = await say('점심에 불닭 2개 먹음');

      expect(records.createFromParsed).toHaveBeenCalledTimes(1);
      expect(result.mutations.created).toHaveLength(1);
    });

    it('모델이 끼니를 NONE 으로 주면 끼니 없이 저장하고, 끼니 없는 같은 음식과 대조한다.', async () => {
      records.findAll.mockResolvedValue({ items: [savedDiet('r1', null, { name: '불닭볶음면' })] });
      mockRecordDiet({
        items: [{ name: '불닭볶음면', mealType: 'NONE', quantity: 2, unit: '개', estimated: true }],
        again: false,
      });

      await say('불닭볶음면 2개 먹었어');

      expect(records.createFromParsed).not.toHaveBeenCalled();
      expect(toolResult()).toContain('이미 기록돼 있어 넣지 않은 항목: 불닭볶음면');
    });

    it('모델에게 주는 "이 날의 기록"에 끼니와 수량을 싣는다.', async () => {
      records.findAll.mockResolvedValue({
        items: [
          savedDiet('lunch', 'LUNCH', {
            name: '불닭볶음면',
            quantity: 2,
            unit: '개',
            calories: 1061,
          }),
        ],
      });
      // 툴 호출 없이 답만 하는 턴
      openai.chat.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ reply: '응답', suggestions: [] }) } }],
      });

      await say('오늘 뭐 먹었지?');

      expect(sentMessages(0)[0]?.content).toContain(
        '- id=lunch | 식단 | 점심 | 불닭볶음면 2개 1061kcal',
      );
    });
  });
});
