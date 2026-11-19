import { Injectable, Logger } from '@nestjs/common';
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import { RecordsService } from '../records/records.service';
import { OpenAIClient } from './openai.client';
import { CHAT_AGENT_SYSTEM_PROMPT, CHAT_FINALIZE_PROMPT } from './prompts/chat-agent.system';
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
    await this.quota.assertAvailable({ id: userId, isGuest: params.isGuest });
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
    const systemContent = [
      CHAT_AGENT_SYSTEM_PROMPT,
      buildDateContext(recordedAt),
      buildDayContext(dayRecords),
    ].join('\n\n');
    const historyParams: ChatCompletionMessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2) pass 1 - 툴 결정
    const first = await this.openai.chat({
      messages: [{ role: 'system', content: systemContent }, ...historyParams],
      tools: CHAT_AGENT_TOOLS,
      toolChoice: 'auto',
      temperature: 0.2,
    });
    await this.quota.consume({ id: userId, isGuest: params.isGuest }); // 첫 호출 성공 → 이 턴 1회 카운트

    const assistantMsg = first.choices[0]?.message;
    const functionCalls = (assistantMsg?.tool_calls ?? []).filter((c) => c.type === 'function');

    // 3) 툴 실행 -> mutations + 모델에게 돌려줄 결과
    const { mutations, toolResults } = await this.runTools(
      userId,
      functionCalls,
      recordedAt,
      lastUser,
    );

    // 4) pass 2 - 자연어 응답 + 추천 질문(JSON)
    const pass2: ChatCompletionMessageParam[] = [
      { role: 'system', content: `${systemContent}\n\n${CHAT_FINALIZE_PROMPT}` },
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

      const args = parseToolArgs(call.function.arguments);
      let summary: string;
      try {
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
