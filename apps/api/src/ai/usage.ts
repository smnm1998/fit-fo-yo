import type { ChatCompletion } from 'openai/resources/chat/completions';

export type CallUsage = { input: number; cached: number; output: number };

/** OpenAI 응답의 토큰 사용량 -> 로그용 숫자 3개 (cached = 입력 중 프롬프트 캐시로 할인된 토큰) */
export function callUsage(response: Pick<ChatCompletion, 'usage'>): CallUsage {
  const usage = response.usage;
  return {
    input: usage?.prompt_tokens ?? 0,
    cached: usage?.prompt_tokens_details?.cached_tokens ?? 0,
    output: usage?.completion_tokens ?? 0,
  };
}
