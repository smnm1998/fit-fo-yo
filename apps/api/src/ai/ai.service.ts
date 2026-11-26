import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OpenAIClient } from './openai.client';
import { PARSE_RECORD_SYSTEM_PROMPT } from './prompts/parse-record.system';
import {
  PARSE_RECORD_TOOLS,
  type ParsedDietPayload,
  type ParsedExercisePayload,
  type ParsedResult,
} from './schemas/function-schemas';
import { DEFAULT_WEIGHT_KG } from './calorie.calculator';
import { GuestQuotaService } from './guest-quota.service';
import { RecordWriter } from './record.writer';
import { buildDateContext } from './day-context';
import { parseToolArgs, resolveRecordedAt } from './tool-args';

/** 한 문장 -> 한 번에 기록 (모델이 식단/운동/도메인 밖으로 분류하고, 서버가 칼로리를 계산해 저장) */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openai: OpenAIClient,
    private readonly writer: RecordWriter,
    private readonly quota: GuestQuotaService,
  ) {}

  /**
   * 순수 파싱 - LLM 호출 + tool_call 분류만 (저장 x)
   * 병렬 tool call 지원: 식단+운동이 함께 오면 결과가 2개
   */
  async parse(rawInput: string, recordedAt?: string): Promise<ParsedResult[]> {
    const response = await this.openai.chatWithTools({
      system: `${PARSE_RECORD_SYSTEM_PROMPT}\n\n${buildDateContext(recordedAt)}`,
      user: rawInput,
      tools: PARSE_RECORD_TOOLS,
      toolChoice: 'required',
    });

    const results: ParsedResult[] = [];
    for (const toolCall of response.choices[0]?.message.tool_calls ?? []) {
      if (toolCall.type !== 'function') continue;
      const args = parseToolArgs(toolCall.function.arguments);
      switch (toolCall.function.name) {
        case 'record_diet':
          results.push({ kind: 'diet', payload: args as ParsedDietPayload });
          break;
        case 'record_exercise':
          results.push({ kind: 'exercise', payload: args as ParsedExercisePayload });
          break;
        case 'record_invalid_domain':
          results.push({
            kind: 'invalid_domain',
            reason: (args as { reason?: string }).reason ?? '도메인 밖 입력',
          });
          break;
        default:
          throw new InternalServerErrorException(`Unknown tool: ${toolCall.function.name}`);
      }
    }

    if (results.length === 0) {
      this.logger.error(
        `OpenAI returned no tool_call. raw response: ${JSON.stringify(response.choices[0])}`,
      );
      throw new InternalServerErrorException('AI 파싱 결과를 받지 못했습니다.');
    }
    return results;
  }

  /**
   * 파싱 + Records 저장. 컨트롤러에서 호출하는 메인 진입점.
   * 식단 + 운동이 함께면 각각 저장, 생성된 레코드 배열 반환
   */
  async parseAndSave(params: {
    userId: string;
    isGuest?: boolean;
    rawInput: string;
    fallbackRecordedAt?: string;
  }) {
    // 게스트는 파싱까지 성공해야 1회로 남음
    const results = await this.quota.charge({ id: params.userId, isGuest: params.isGuest }, () =>
      this.parse(params.rawInput, params.fallbackRecordedAt),
    );
    const valid = results.filter(
      (r): r is Extract<ParsedResult, { kind: 'diet' | 'exercise' }> => r.kind !== 'invalid_domain',
    );

    if (valid.length === 0) {
      const invalid = results.find(
        (r): r is Extract<ParsedResult, { kind: 'invalid_domain' }> => r.kind === 'invalid_domain',
      );
      throw new BadRequestException({
        code: 'INVALID_DOMAIN',
        message: '식단 또는 운동과 관련된 내용을 입력해주세요.',
        reason: invalid?.reason,
      });
    }

    const weightKg = valid.some((r) => r.kind === 'exercise')
      ? await this.writer.loadWeightKg(params.userId)
      : DEFAULT_WEIGHT_KG;

    return Promise.all(
      valid.map((parsed) => {
        const recordedAt = resolveRecordedAt(parsed.payload.recordedAt, params.fallbackRecordedAt);
        return parsed.kind === 'diet'
          ? this.writer.createDiet(params.userId, parsed.payload, recordedAt, params.rawInput)
          : this.writer.createExercise(
              params.userId,
              parsed.payload,
              recordedAt,
              params.rawInput,
              weightKg,
            );
      }),
    );
  }
}
