import { Test } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RecordType } from '@fitfoyo/database';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { RecordsService } from '../records/records.service';
import { NutritionService } from '../nutrition/nutrition.service';

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
  let openai: { chatWithTools: jest.Mock };
  let records: { createFromParsed: jest.Mock };
  let nutrition: { lookupMany: jest.Mock };

  beforeEach(async () => {
    openai = { chatWithTools: jest.fn() };
    records = { createFromParsed: jest.fn((x) => Promise.resolve({ id: 'rec_1', ...x })) };
    // 기본: 시드 미등록(빈 Map) → LLM 재계산 폴백. 등록 케이스는 테스트마다 override.
    nutrition = { lookupMany: jest.fn().mockResolvedValue(new Map()) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OpenAIClient, useValue: openai },
        { provide: RecordsService, useValue: records },
        { provide: NutritionService, useValue: nutrition },
      ],
    }).compile();

    service = moduleRef.get(AiService);
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
          ['불닭볶음면', { name: '불닭볶음면', caloriesPer100g: 408, gramsPerServing: 130 }],
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
      expect(arg.dietItems[0].calories).toBe(1061); // 408 × (2 × 130) / 100
      expect(arg.dietItems[0].estimated).toBe(false); // DB 근거 → 추정 아님
    });

    it('등록 음식을 g/ml 로 주면 사용자 그램수 × DB 밀도 로 계산한다', async () => {
      // 실제 시드값: 닭가슴살 { caloriesPer100g: 165, gramsPerServing: 100 }
      nutrition.lookupMany.mockResolvedValue(
        new Map([['닭가슴살', { name: '닭가슴살', caloriesPer100g: 165, gramsPerServing: 100 }]]),
      );
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_diet', {
          items: [
            {
              name: '닭가슴살',
              quantity: 200,
              unit: 'g',
              gramsEstimate: 200, // 무게 직접 지정 → g 분기에서 신뢰
              caloriesPer100g: 999, // LLM 값은 무시, DB 165 사용
              calories: 1998,
              estimated: true,
            },
          ],
        }),
      );

      await service.parseAndSave({ userId: 'u1', rawInput: '닭가슴살 200g' });

      const arg = records.createFromParsed.mock.calls[0][0];
      expect(arg.dietItems[0].calories).toBe(330); // 165 × 200 / 100
      expect(arg.dietItems[0].estimated).toBe(false);
    });
  });
});
