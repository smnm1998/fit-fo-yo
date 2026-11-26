import { Injectable, Logger } from '@nestjs/common';
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { RecordsService } from '../records/records.service';
import { OpenAIClient } from './openai.client';
import {
  CHAT_AGENT_SYSTEM_PROMPT,
  CHAT_FINALIZE_PROMPT,
  CHAT_REPLY_ROLE_PROMPT,
} from './prompts/chat-agent.system';
import {
  CHAT_AGENT_TOOLS,
  type DeleteRecordPayload,
  type ParsedDietPayload,
  type ParsedExercisePayload,
  type UpdateRecordPayload,
} from './schemas/function-schemas';
import { GuestQuotaService } from './guest-quota.service';
import { RecordWriter } from './record.writer';
import { buildDateContext, buildDayContext, dayRangeKST } from './day-context';
import { parseToolArgs, resolveRecordedAt } from './tool-args';
import { callUsage } from './usage';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Mutations = {
  created: Awaited<ReturnType<RecordsService['createFromParsed']>>[];
  updated: Awaited<ReturnType<RecordsService['update']>>[];
  deletedIds: string[];
};

/** 대화형 기록 에이전트: 1차(모델이 툴 결정) → 툴 실행 → 2차(작업 결과로 답변·추천 문구) */
@Injectable()
export class ChatAgentService {
  private readonly logger = new Logger(ChatAgentService.name);

  constructor(
    private readonly openai: OpenAIClient,
    private readonly records: RecordsService,
    private readonly writer: RecordWriter,
    private readonly quota: GuestQuotaService,
  ) {}

  async chat(params: {
    userId: string;
    isGuest?: boolean;
    messages: ChatMessage[];
    recordedAt?: string;
  }) {
    const { userId, recordedAt } = params;
    const history = params.messages.slice(-12);
    const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';

    // 1) 이 날의 기록 컨텍스트(id 포함)
    const { from, to } = dayRangeKST(recordedAt);
    const { items: dayRecords } = await this.records.findAll(userId, {
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 50,
      offset: 0,
    });
    const context = [buildDateContext(recordedAt), buildDayContext(dayRecords)].join('\n\n');
    const historyParams: ChatCompletionMessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2) pass 1 - 툴 결정 (게스트는 이 호출이 성공해야 이 턴이 1회로 남음)
    const first = await this.quota.charge({ id: userId, isGuest: params.isGuest }, () =>
      this.openai.chat({
        messages: [
          { role: 'system', content: `${CHAT_AGENT_SYSTEM_PROMPT}\n\n${context}` },
          ...historyParams,
        ],
        tools: CHAT_AGENT_TOOLS,
        toolChoice: 'auto',
        temperature: 0.2,
      }),
    );

    const assistantMsg = first.choices[0]?.message;
    const functionCalls = (assistantMsg?.tool_calls ?? []).filter((c) => c.type === 'function');

    // 3) 툴 실행 -> mutations + 모델에게 돌려줄 결과
    const { mutations, toolResults } = await this.runTools(
      userId,
      functionCalls,
      recordedAt,
      lastUser,
    );

    // 4) pass 2 - 자연어 응답 + 추천 질문(JSON), 툴 규칙은 빼고 역할 안내만
    const pass2: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: [CHAT_REPLY_ROLE_PROMPT, context, CHAT_FINALIZE_PROMPT].join('\n\n'),
      },
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

    // 비용 측정: 한 턴의 1차·2차 토큰을 한 줄로 (운영 로그에서 턴 단위로 모을 수 있게)
    this.logger.log(
      `chat usage ${JSON.stringify({
        pass1: callUsage(first),
        pass2: callUsage(second),
        tools: functionCalls.length,
      })}`,
    );

    return { ...parseFinalReply(second.choices[0]?.message.content), mutations };
  }

  /** 툴을 하나씩 실행, 실패해도 멈추지 않고 결과 문장을 모델에게 넘김 */
  private async runTools(
    userId: string,
    calls: ChatCompletionMessageFunctionToolCall[],
    recordedAt: string | undefined,
    rawInput: string,
  ): Promise<{ mutations: Mutations; toolResults: ChatCompletionMessageParam[] }> {
    const mutations: Mutations = { created: [], updated: [], deletedIds: [] };
    const toolResults: ChatCompletionMessageParam[] = [];

    // 운동 관련 툴이 나올 때만 (한 턴에 1번만 조회)
    let cachedWeight: number | null = null;
    const weight = async (): Promise<number> =>
      (cachedWeight ??= await this.writer.loadWeightKg(userId));

    for (const call of calls) {
      this.logger.debug(`tool ${call.function.name} ${call.function.arguments}`);

      let summary: string;
      try {
        // 깨진 인자도 이 툴 하나의 실패로 처리 (앞에서 저장한 툴의 결과는 그대로 응답에 남김)
        const args = parseToolArgs(call.function.arguments);
        switch (call.function.name) {
          case 'record_diet': {
            const payload = args as ParsedDietPayload;
            const outcome = await this.writer.recordDiet(
              userId,
              payload,
              resolveRecordedAt(payload.recordedAt, recordedAt),
              rawInput,
            );
            if (outcome.created) mutations.created.push(outcome.created);
            if (outcome.updated) mutations.updated.push(outcome.updated);
            summary = outcome.summary;
            break;
          }
          case 'record_exercise': {
            const payload = args as ParsedExercisePayload;
            const rec = await this.writer.createExercise(
              userId,
              payload,
              resolveRecordedAt(payload.recordedAt, recordedAt),
              rawInput,
              await weight(),
            );
            mutations.created.push(rec);
            summary = `운동 등록 완료 (id=${rec.id})`;
            break;
          }
          case 'update_record': {
            const rec = await this.writer.update(userId, args as UpdateRecordPayload);
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

    return { mutations, toolResults };
  }
}

/** 2차 응답(JSON 문자열) -> { reply, suggestions } */
function parseFinalReply(content: string | null | undefined): {
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
