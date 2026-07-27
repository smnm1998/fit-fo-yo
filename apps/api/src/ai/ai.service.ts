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

/** 체중 미상 사용자 기본값. HealthProfile 연동 시 대체 예정. */
const DEFAULT_WEIGHT_KG = 65;

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
          mealType: item.mealType || undefined,
          quantity: item.quantity,
          unit: item.unit,
          calories: this.resolveCalories(item),
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
        caloriesBurned: this.resolveCaloriesBurned(item),
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

  /**
   * 칼로리는 LLM 산수를 신뢰하지 않고 서버에서 재계산한다.
   * 근거값(100g당 kcal, 환산 그램)이 없으면 LLM 값으로 폴백.
   */
  private resolveCalories(item: {
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

  /** 소모 칼로리 = MET × 3.5 × 체중(kg) / 200 × 분 */
  private resolveCaloriesBurned(item: {
    met?: number;
    durationMinutes?: number;
    caloriesBurned?: number;
  }): number | undefined {
    const { met, durationMinutes } = item;
    if (
      typeof met === 'number' &&
      typeof durationMinutes === 'number' &&
      met > 0 &&
      durationMinutes > 0
    ) {
      return Math.round(((met * 3.5 * DEFAULT_WEIGHT_KG) / 200) * durationMinutes);
    }
    return item.caloriesBurned;
  }

  private resolveRecordedAt(fromAi: string | undefined, fallback: string | undefined): Date {
    if (fromAi) return new Date(fromAi);
    if (fallback) return new Date(fallback);
    return new Date();
  }
}
