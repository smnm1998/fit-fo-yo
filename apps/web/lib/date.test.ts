import { afterEach, describe, expect, it, vi } from 'vitest';
import { dayKeyKST, isDayKey, monthGridKST, moveToDayKST, shiftMonth } from '@/lib/date';

describe('isDayKey', () => {
  it('달력에 있는 날짜는 통과한다', () => {
    expect(isDayKey('2026-11-20')).toBe(true);
    expect(isDayKey('2024-02-29')).toBe(true);
  });

  it('형식이 틀리면 거부한다.', () => {
    expect(isDayKey('2026-1-5')).toBe(false);
    expect(isDayKey('2026-dd-dd')).toBe(false);
    expect(isDayKey(20261120)).toBe(false);
    expect(isDayKey(undefined)).toBe(false);
  });

  it('형식은 맞아도 달력에 없는 날짜는 거부한다.', () => {
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2026-02-29')).toBe(false);
    expect(isDayKey('2026-13-01')).toBe(false);
  });
});

describe('dayKeyKST', () => {
  afterEach(() => vi.restoreAllMocks());

  it('UTC 시각을 KST 날짜로 바꾼다(KST 자정 = UTC 15시).', () => {
    expect(dayKeyKST('2026-11-23T14:59:59.999Z')).toBe('2026-11-23');
    expect(dayKeyKST('2026-11-23T15:00:00.000Z')).toBe('2026-11-24');
  });

  it('잘못된 값은 빈 문자열을 돌려준다.', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dayKeyKST('not-a-date')).toBe('');
  });
});

describe('moveToDayKST', () => {
  it('KST 시각은 그대로 두고 날짜만 바꾼다.', () => {
    // 9/10 08:30 KST(= 9/9 23:30Z) -> 9/12 08:30 KST(= 9/11 23:30Z)
    expect(moveToDayKST('2026-09-09T23:30:00.000Z', '2026-09-12')).toBe('2026-09-11T23:30:00.000Z');
  });
});

describe('shiftMonth', () => {
  it('연도 경계를 넘어 이동한다.', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-03', -14)).toBe('2025-01');
    expect(shiftMonth('2026-05', 0)).toBe('2026-05');
  });
});

describe('monthGridKST', () => {
  it('일요일에 시작해 토요일에 끝나는 주 단위 그리드', () => {
    const grid = monthGridKST('2026-11');
    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toBe('2026-11-01');
    expect(grid).toContain('2026-11-30');
    expect(grid.at(-1)).toBe('2026-12-05');
  });
});
