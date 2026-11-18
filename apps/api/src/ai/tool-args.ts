import { InternalServerErrorException } from '@nestjs/common';

/** 모델이 준 tool 인자(JSON 문자열) -> 객체, 깨진 JSON이면 500 */
export function parseToolArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new InternalServerErrorException('AI 응답 JSON 파싱 실패');
  }
}

/** 기록 시각: 모델이 준 값 -> 사용자가 보고 있던 날짜 -> 지금 */
export function resolveRecordedAt(fromAi: string | undefined, fallback: string | undefined): Date {
  if (fromAi) return new Date(fromAi);
  if (fallback) return new Date(fallback);
  return new Date();
}
