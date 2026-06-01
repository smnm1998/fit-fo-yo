import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, RecordType } from '@fitfoyo/database';
import { RecordsService } from '../records/records.service';
import { OpenAIClient } from './openai.client';
import { PARSE_RECORD_SYSTEM_PROMPT } from './prompts/parse-record.system';
import {
  PARSE_RECORD_TOOLS,
  type ParsedDietPayload,
  type ParsedExercisePayload,
  type ParsedResult,
} from './schemas/function-schemas';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openai: OpenAIClient,
    private readonly records: RecordsService,
  ) {}

  /**
   * 순수 파싱 — LLM 호출 + tool_call 분류만. 저장 없음.
   * 테스트 시 OpenAIClient mocking 으로 격리 검증.
   */
  async parse(rawInput: string): Promise<ParsedResult> {
    const response = await this.openai.chatWithTools({
      system: PARSE_RECORD_SYSTEM_PROMPT,
      user: rawInput,
      tools: PARSE_RECORD_TOOLS,
      toolChoice: 'required',
    });

    const toolCall = response.choices[0]?.message.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function') {
      this.logger.error(
        `OpenAI returned no tool_call. raw response: ${JSON.stringify(response.choices[0])}`,
      );
      throw new InternalServerErrorException('AI 파싱 결과를 받지 못했습니다.');
    }

    const args = this.safeParseJson(toolCall.function.arguments);

    switch (toolCall.function.name) {
      case 'record_diet':
        return { kind: 'diet', payload: args as ParsedDietPayload };
      case 'record_exercise':
        return { kind: 'exercise', payload: args as ParsedExercisePayload };
      case 'record_invalid_domain':
        return {
          kind: 'invalid_domain',
          reason: (args as { reason?: string }).reason ?? '도메인 밖 입력',
        };
      default:
        throw new InternalServerErrorException(`Unknown tool: ${toolCall.function.name}`);
    }
  }

  /**
   * 파싱 + Records 저장. 컨트롤러에서 호출하는 메인 진입점.
   */
  async parseAndSave(params: { userId: string; rawInput: string; fallbackRecordedAt?: string }) {
    const parsed = await this.parse(params.rawInput);

    if (parsed.kind === 'invalid_domain') {
      throw new BadRequestException({
        code: 'INVALID_DOMAIN',
        message: '식단 또는 운동과 관련된 내용을 입력해주세요.',
        reason: parsed.reason,
      });
    }

    const recordedAt = this.resolveRecordedAt(
      parsed.kind === 'diet' ? parsed.payload.recordedAt : parsed.payload.recordedAt,
      params.fallbackRecordedAt,
    );

    if (parsed.kind === 'diet') {
      return this.records.createFromParsed({
        userId: params.userId,
        type: RecordType.DIET,
        rawInput: params.rawInput,
        parsedJson: parsed.payload as unknown as Prisma.InputJsonValue,
        recordedAt,
        dietItems: parsed.payload.items.map((item) => ({
          name: item.name,
          mealType: item.mealType,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          carbs: item.carbs,
          protein: item.protein,
          fat: item.fat,
          estimated: item.estimated,
        })),
      });
    }

    return this.records.createFromParsed({
      userId: params.userId,
      type: RecordType.EXERCISE,
      rawInput: params.rawInput,
      parsedJson: parsed.payload as unknown as Prisma.InputJsonValue,
      recordedAt,
      exerciseItems: parsed.payload.items.map((item) => ({
        name: item.name,
        durationMinutes: item.durationMinutes,
        intensity: item.intensity,
        caloriesBurned: item.caloriesBurned,
        estimated: item.estimated,
      })),
    });
  }

  private safeParseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException('AI 응답 JSON 파싱 실패');
    }
  }

  private resolveRecordedAt(fromAi: string | undefined, fallback: string | undefined): Date {
    if (fromAi) return new Date(fromAi);
    if (fallback) return new Date(fallback);
    return new Date();
  }
}
