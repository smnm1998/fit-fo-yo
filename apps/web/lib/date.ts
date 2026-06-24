import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Seoul';

export function todayRangeKST(): { from: string; to: string } {
  const zonedNow = toZonedTime(new Date(), TZ);
  const from = fromZonedTime(startOfDay(zonedNow), TZ).toISOString();
  const to = fromZonedTime(endOfDay(zonedNow), TZ).toISOString();
  return { from, to };
}

/** 'YYYY-MM' (KST 기준 달)을 그 달 [월초 00:00, 월말 23:59:59.999] 을 UTC ISO로 전환 */
export function monthRangeKST(month: string): { from: string; to: string } {
  const midMonthUtc = new Date(`${month}-15T00:00:00Z`);
  const zoned = toZonedTime(midMonthUtc, TZ);
  const from = fromZonedTime(startOfMonth(zoned), TZ).toISOString();
  const to = fromZonedTime(endOfMonth(zoned), TZ).toISOString();
  return { from, to };
}

/** 현재 KST 기준 'YYYY-MM' (page.tsx 기본 월) */
export function currentMonthKST(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM');
}

/** 현재 KST 기준 'YYYY-MM-DD' (기본 선택일) */
export function todayKST(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

/** UTC ISO -> 그 인스턴스가 KST로 며칠인지 'YYYY-MM-DD' */
export function dayKeyKST(iso: string): string {
  return formatInTimeZone(new Date(iso), TZ, 'yyyy-MM-dd');
}

/** 'YYYY-MM' -> 6주 달력 그리드용 'YYYY-MM-DD' 배열 */
export function monthGridKST(month: string): string[] {
  const midMonthUtc = new Date(`${month}-15T00:00:00Z`);
  const zoned = toZonedTime(midMonthUtc, TZ);
  const gridStart = startOfWeek(startOfMonth(zoned), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(zoned), { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((d) => format(d, 'yyyy-MM-dd'));
}

/** 'YYYY-MM'에서 delta 개월 이동 */
export function shiftMonth(month: string, delta: number): string {
  const [yStr, mStr] = month.split('-');
  const idx = Number(yStr) * 12 + (Number(mStr) - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

/** 'YYYY-MM' -> '2026년 6월' */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
}

/** 'YYYY-MM-DD' -> '6월 14일' */
export function dateLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

/** 지난 n일(오늘 포함)의 UTC 범위 */
export function weekRangeKST(days = 7): { from: string; to: string } {
  const zonedNow = toZonedTime(new Date(), TZ);
  const from = fromZonedTime(startOfDay(subDays(zonedNow, days - 1)), TZ).toISOString();
  const to = fromZonedTime(endOfDay(zonedNow), TZ).toISOString();
  return { from, to };
}

/** 지난 n일의 'YYYY-MM-DD' 배열(오래된->오늘, KST) - 차트 x축: 집계 정렬용 */
export function weekDayKeysKST(days = 7): string[] {
  const end = startOfDay(toZonedTime(new Date(), TZ));
  return Array.from({ length: days }, (_, i) => format(subDays(end, days - 1 - i), 'yyyy-MM-dd'));
}

/** 인사말용 — "6월 23일 월요일" (KST) */
export function todayLabelLong(): string {
  return formatInTimeZone(new Date(), TZ, 'M월 d일 EEEE', { locale: ko });
}

/** dayKey('YYYY-MM-DD') → 그 날 정오(KST) ISO. recordedAt 기본값용(정오라 UTC 변환에도 날짜 안 밀림) */
export function dayNoonIsoKST(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00+09:00`).toISOString();
}
