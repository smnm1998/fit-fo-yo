import { Test } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { RecordType } from '@fitfoyo/database';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { RecordsService } from '../records/records.service';

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

  beforeEach(async () => {
    openai = { chatWithTools: jest.fn() };
    records = { createFromParsed: jest.fn((x) => Promise.resolve({ id: 'rec_1', ...x })) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: OpenAIClient, useValue: openai },
        { provide: RecordsService, useValue: records },
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

      expect(result.kind).toBe('diet');
      if (result.kind === 'diet') {
        expect(result.payload.items[0].name).toBe('닭가슴살');
      }
    });

    it('record_exercise tool_call 을 exercise 결과로 분류한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_exercise', {
          items: [{ name: '러닝', durationMinutes: 30, estimated: true }],
        }),
      );

      const result = await service.parse('30분 러닝');

      expect(result.kind).toBe('exercise');
    });

    it('record_invalid_domain 은 invalid_domain + reason 으로 분류한다', async () => {
      openai.chatWithTools.mockResolvedValue(
        toolCallResponse('record_invalid_domain', { reason: '일상 잡담' }),
      );

      const result = await service.parse('내일 날씨 어때?');

      expect(result.kind).toBe('invalid_domain');
      if (result.kind === 'invalid_domain') {
        expect(result.reason).toBe('일상 잡담');
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

  it('calories 를 caloriesPer100g × gramsEstimate 로 재계산한다', async () => {
    openai.chatWithTools.mockResolvedValue(
      toolCallResponse('record_diet', {
        items: [
          {
            name: '김치찌개',
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

    await service.parseAndSave({ userId: 'u1', rawInput: '김치찌개' });

    const arg = records.createFromParsed.mock.calls[0][0];
    expect(arg.dietItems[0].calories).toBe(220); // 55 × 400 / 100
  });
});
