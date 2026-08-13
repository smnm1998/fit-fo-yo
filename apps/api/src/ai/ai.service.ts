import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, RecordType } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsService } from '../records/records.service';
import { OpenAIClient } from './openai.client';
import { PARSE_RECORD_SYSTEM_PROMPT } from './prompts/parse-record.system';
import {
  PARSE_RECORD_TOOLS,
  CHAT_AGENT_TOOLS,
  type ParsedDietPayload,
  type ParsedExercisePayload,
  type ParsedResult,
  type UpdateRecordPayload,
  type DeleteRecordPayload,
} from './schemas/function-schemas';
import type { FoodNutrition } from '@fitfoyo/database';
import { NutritionService, normalizeFoodName } from '../nutrition/nutrition.service';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { CHAT_AGENT_SYSTEM_PROMPT } from './prompts/chat-agent.system';
import { UpdateRecordDto } from '../records/dto/update-record.dto';

/** 체중 미상 사용자 기본값. HealthProfile 연동 시 대체 예정. */
const DEFAULT_WEIGHT_KG = 65;

/** 게스트 AI 사용 상한 (체험용). 초과 시 회원가입 유도. */
const GUEST_AI_LIMIT = 10;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openai: OpenAIClient,
    private readonly records: RecordsService,
    private readonly nutrition: NutritionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 순수 파싱 — LLM 호출 + tool_call 분류만. 저장 없음.
   * 병렬 tool call 지원: 식단+운동이 함께 오면 결과가 2개.
   */
  async parse(rawInput: string): Promise<ParsedResult[]> {
    const response = await this.openai.chatWithTools({
      system: PARSE_RECORD_SYSTEM_PROMPT,
      user: rawInput,
      tools: PARSE_RECORD_TOOLS,
      toolChoice: 'required',
    });

    const results: ParsedResult[] = [];
    for (const toolCall of response.choices[0]?.message.tool_calls ?? []) {
      if (toolCall.type !== 'function') continue;
      const args = this.safeParseJson(toolCall.function.arguments);
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
   * 식단+운동이 함께면 각각 저장 -> 생성된 레코드 배열 반환
   */
  async parseAndSave(params: {
    userId: string;
    isGuest?: boolean;
    rawInput: string;
    fallbackRecordedAt?: string;
  }) {
    await this.assertGuestQuota({ id: params.userId, isGuest: params.isGuest });
    const results = await this.parse(params.rawInput);
    await this.bumpGuestUsage({ id: params.userId, isGuest: params.isGuest });
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

    return Promise.all(
      valid.map((parsed) => {
        const recordedAt = this.resolveRecordedAt(
          parsed.payload.recordedAt,
          params.fallbackRecordedAt,
        );
        return parsed.kind === 'diet'
          ? this.createDiet(params.userId, parsed.payload, recordedAt, params.rawInput)
          : this.createExercise(params.userId, parsed.payload, recordedAt, params.rawInput);
      }),
    );
  }

  /** 게스트 AI 사용 상한 가드. 회원(isGuest=false/undefined)은 no-op. */
  private async assertGuestQuota(user: { id: string; isGuest?: boolean }) {
    if (!user.isGuest) return;
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { aiUsageCount: true },
    });
    if ((row?.aiUsageCount ?? 0) >= GUEST_AI_LIMIT) {
      throw new ForbiddenException(
        `게스트는 AI를 ${GUEST_AI_LIMIT}회까지 체험할 수 있어요. 회원가입하면 계속 사용할 수 있어요.`,
      );
    }
  }

  /** 게스트만 사용 횟수 +1 (회원은 no-op). */
  private async bumpGuestUsage(user: { id: string; isGuest?: boolean }) {
    if (!user.isGuest) return;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { aiUsageCount: { increment: 1 } },
    });
  }

  // ───────── 생성/수정 공용 헬퍼 (parse-and-save & chat) ─────────
  private toDietItemInput(
    item: ParsedDietPayload['items'][number],
    table: Map<string, FoodNutrition>,
  ) {
    const grounded = this.groundCalories(item, table);
    return {
      name: item.name,
      mealType: item.mealType || undefined,
      quantity: item.quantity,
      unit: item.unit,
      grams: grounded.grams,
      calories: grounded.calories,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
      estimated: grounded.estimated,
    };
  }

  private toExerciseItemInput(item: ParsedExercisePayload['items'][number]) {
    return {
      name: item.name,
      durationMinutes: item.durationMinutes,
      intensity: item.intensity,
      caloriesBurned: this.resolveCaloriesBurned(item),
      estimated: item.estimated,
    };
  }

  private async createDiet(
    userId: string,
    payload: ParsedDietPayload,
    recordedAt: Date,
    rawInput: string,
  ) {
    const table = await this.nutrition.lookupMany(payload.items.map((i) => i.name));
    return this.records.createFromParsed({
      userId,
      type: RecordType.DIET,
      rawInput,
      parsedJson: payload as unknown as Prisma.InputJsonValue,
      recordedAt,
      dietItems: payload.items.map((item) => this.toDietItemInput(item, table)),
    });
  }

  private async createExercise(
    userId: string,
    payload: ParsedExercisePayload,
    recordedAt: Date,
    rawInput: string,
  ) {
    return this.records.createFromParsed({
      userId,
      type: RecordType.EXERCISE,
      rawInput,
      parsedJson: payload as unknown as Prisma.InputJsonValue,
      recordedAt,
      exerciseItems: payload.items.map((item) => this.toExerciseItemInput(item)),
    });
  }

  private async updateRecord(userId: string, payload: UpdateRecordPayload) {
    const dto: UpdateRecordDto = {};
    if (payload.recordedAt) dto.recordedAt = payload.recordedAt;
    if (payload.dietItems) {
      const table = await this.nutrition.lookupMany(payload.dietItems.map((i) => i.name));
      dto.dietItems = payload.dietItems.map((item) => this.toDietItemInput(item, table));
    }
    if (payload.exerciseItems) {
      dto.exerciseItems = payload.exerciseItems.map((item) => this.toExerciseItemInput(item));
    }
    return this.records.update(userId, payload.recordId, dto);
  }

  private safeParseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException('AI 응답 JSON 파싱 실패');
    }
  }

  /**
   * 등록 음식이면 DB 근거값으로 확정(estimated=false), 미등록이면 LLM 재계산 폴백.
   */
  private groundCalories(
    item: {
      name: string;
      unit?: string;
      quantity?: number;
      gramsEstimate?: number;
      caloriesPer100g?: number;
      calories?: number;
      estimated: boolean;
    },
    table: Map<string, FoodNutrition>,
  ): { calories?: number; grams?: number; estimated: boolean } {
    const hit = table.get(normalizeFoodName(item.name));
    if (hit) {
      const grams = this.resolveGrams(item, hit.gramsPerServing);
      return {
        calories: Math.round((hit.caloriesPer100g * grams) / 100),
        grams: Math.round(grams),
        estimated: false,
      };
    }
    const grams =
      typeof item.gramsEstimate === 'number' && item.gramsEstimate > 0
        ? Math.round(item.gramsEstimate)
        : undefined;
    return { calories: this.resolveCalories(item), grams, estimated: item.estimated };
  }

  /** g/ml 로 무게를 직접 준 경우만 LLM grams 신뢰, 아니면 DB 대표 그램수 × 수량 */
  private resolveGrams(
    item: { unit?: string; quantity?: number; gramsEstimate?: number },
    gramsPerServing: number,
  ): number {
    const { unit, quantity, gramsEstimate } = item;
    if ((unit === 'g' || unit === 'ml') && typeof gramsEstimate === 'number' && gramsEstimate > 0) {
      return gramsEstimate;
    }
    const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    return qty * gramsPerServing;
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

  // ───────── 대화형 에이전트 ─────────

  async chat(params: {
    userId: string;
    isGuest?: boolean;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    recordedAt?: string;
  }) {
    const { userId, recordedAt } = params;
    await this.assertGuestQuota({ id: userId, isGuest: params.isGuest });
    const history = params.messages.slice(-12);
    const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';

    // 1) 이 날의 기록 컨텍스트(id 포함)
    const { from, to } = this.dayRange(recordedAt);
    const { items: dayRecords } = await this.records.findAll(userId, {
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 50,
      offset: 0,
    });
    const systemContent = `${CHAT_AGENT_SYSTEM_PROMPT}\n\n${this.buildDayContext(dayRecords)}`;
    const historyParams: ChatCompletionMessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2) pass 1 — 툴 결정
    const first = await this.openai.chat({
      messages: [{ role: 'system', content: systemContent }, ...historyParams],
      tools: CHAT_AGENT_TOOLS,
      toolChoice: 'auto',
      temperature: 0.2,
    });
    await this.bumpGuestUsage({ id: userId, isGuest: params.isGuest }); // 첫 호출 성공 → 이 턴 1회 카운트

    const assistantMsg = first.choices[0]?.message;
    const functionCalls = (assistantMsg?.tool_calls ?? []).filter((c) => c.type === 'function');

    // 3) 툴 디스패치 → mutations
    const mutations = {
      created: [] as Awaited<ReturnType<RecordsService['createFromParsed']>>[],
      updated: [] as Awaited<ReturnType<RecordsService['update']>>[],
      deletedIds: [] as string[],
    };
    const toolResults: ChatCompletionMessageParam[] = [];

    for (const call of functionCalls) {
      const args = this.safeParseJson(call.function.arguments);
      let summary: string;
      try {
        switch (call.function.name) {
          case 'record_diet': {
            const payload = args as ParsedDietPayload;
            const rec = await this.createDiet(
              userId,
              payload,
              this.resolveRecordedAt(payload.recordedAt, recordedAt),
              lastUser,
            );
            mutations.created.push(rec);
            summary = `식단 등록 완료 (id=${rec.id})`;
            break;
          }
          case 'record_exercise': {
            const payload = args as ParsedExercisePayload;
            const rec = await this.createExercise(
              userId,
              payload,
              this.resolveRecordedAt(payload.recordedAt, recordedAt),
              lastUser,
            );
            mutations.created.push(rec);
            summary = `운동 등록 완료 (id=${rec.id})`;
            break;
          }
          case 'update_record': {
            const rec = await this.updateRecord(userId, args as UpdateRecordPayload);
            mutations.updated.push(rec);
            summary = `수정 완료 (id=${rec.id})`;
            break;
          }
          case 'delete_record': {
            const { recordId } = args as DeleteRecordPayload;
            await this.records.remove(userId, recordId);
            mutations.deletedIds.push(recordId);
            summary = `삭제 완료 (id=${recordId})`;
            break;
          }
          default:
            summary = `알 수 없는 작업: ${call.function.name}`;
        }
      } catch (err) {
        summary = `실패: ${err instanceof Error ? err.message : String(err)}`;
      }
      toolResults.push({ role: 'tool', tool_call_id: call.id, content: summary });
    }

    // 4) pass 2 — 자연어 응답 + 추천 질문(JSON)
    const finalize =
      '지금까지의 대화와 작업 결과를 바탕으로 사용자에게 한국어로 짧고 친근하게 답하세요. ' +
      'suggestions는 "사용자가 다음에 그대로 타이핑해 보낼 문구"를 사용자 1인칭 시점으로 2~3개 제안하세요. ' +
      '(예: "저녁도 기록할래", "물 2잔 마셨어", "오늘 총 칼로리 알려줘") ' +
      '봇이 사용자에게 되묻는 질문이 아니라, 사용자가 입력할 프롬프트여야 합니다. ' +
      '반드시 JSON만 출력: {"reply": string, "suggestions": string[]}';

    const pass2: ChatCompletionMessageParam[] = [
      { role: 'system', content: `${systemContent}\n\n${finalize}` },
      ...historyParams,
    ];
    if (functionCalls.length > 0 && assistantMsg) {
      pass2.push(
        { role: 'assistant', content: assistantMsg.content ?? '', tool_calls: functionCalls },
        ...toolResults,
      );
    }
    const second = await this.openai.chat({
      messages: pass2,
      responseFormat: { type: 'json_object' },
      temperature: 0.6,
    });

    return { ...this.parseFinalize(second.choices[0]?.message.content), mutations };
  }

  private parseFinalize(content: string | null | undefined): {
    reply: string;
    suggestions: string[];
  } {
    const fallback = { reply: '처리했어요. 더 도와드릴까요?', suggestions: [] as string[] };
    if (!content) return fallback;
    try {
      const json = JSON.parse(content) as { reply?: unknown; suggestions?: unknown };
      const reply =
        typeof json.reply === 'string' && json.reply.trim() ? json.reply.trim() : fallback.reply;
      const suggestions = Array.isArray(json.suggestions)
        ? json.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 3)
        : [];
      return { reply, suggestions };
    } catch {
      return fallback;
    }
  }

  private dayRange(recordedAt?: string): { from: Date; to: Date } {
    const KST = 9 * 60 * 60 * 1000;
    const base = recordedAt ? new Date(recordedAt) : new Date();
    const k = new Date(base.getTime() + KST);
    const y = k.getUTCFullYear();
    const m = k.getUTCMonth();
    const d = k.getUTCDate();
    return {
      from: new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - KST),
      to: new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - KST),
    };
  }

  private buildDayContext(
    records: Awaited<ReturnType<RecordsService['findAll']>>['items'],
  ): string {
    if (records.length === 0) return '이 날의 기록: (아직 없음)';
    const lines = records.map((r) => {
      if (r.type === RecordType.DIET) {
        const items = r.dietItems
          .map((d) => `${d.name}${d.calories != null ? ` ${d.calories}kcal` : ''}`)
          .join(', ');
        return `- id=${r.id} | 식단 | ${items || '항목 없음'}`;
      }
      const items = r.exerciseItems
        .map((e) => `${e.name}${e.durationMinutes != null ? ` ${e.durationMinutes}분` : ''}`)
        .join(', ');
      return `- id=${r.id} | 운동 | ${items || '항목 없음'}`;
    });
    return ['이 날의 기록 (수정/삭제 시 아래 id 사용):', ...lines].join('\n');
  }
}
