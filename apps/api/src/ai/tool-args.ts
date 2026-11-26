import { InternalServerErrorException } from '@nestjs/common';

/** 모델이 준 tool 인자(JSON 문자열) -> 객체, 깨진 JSON이면 500 */
export function parseToolArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new InternalServerErrorException('AI 응답 JSON 파싱 실패');
  }
}

/** 날짜 문자열 -> Date, 해석할 수 없으면 null (Invalid Date가 DB까지 가면 500) */
export function toValidDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 기록 시각: 모델이 준 값 -> 사용자가 보고 있던 날짜 -> 지금
 * 모델 값은 형식을 보장할 수 없으므로, 해석이 안 되면 다음 후보로 넘어간다
 */
export function resolveRecordedAt(fromAi: string | undefined, fallback: string | undefined): Date {
  return toValidDate(fromAi) ?? toValidDate(fallback) ?? new Date();
}
