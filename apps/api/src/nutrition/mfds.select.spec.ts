import type { MfdsRow } from './mfds.client';
import { pickRow } from './mfds.select';

/** 테스트용 식약처 행 (기본값 + 바꿀 필드만) */
function row(overrides: Partial<MfdsRow>): MfdsRow {
  return {
    dataset: 'FOOD',
    foodCd: 'X',
    foodNm: '테스트',
    originCd: null,
    basis: 'g',
    kcalPer100: 100,
    sizeGrams: null,
    referenceDate: null,
    ...overrides,
  };
}

describe('pickRow - 음식', () => {
  // 2026-10-01 실제 응답: 외식 분석 1행 + 급식 산출 2행
  const kimchiStew = [
    row({ foodCd: 'D306-266000000-0001', originCd: '3', kcalPer100: 61, sizeGrams: 400 }),
    row({ foodCd: 'D706-266000000-0001', originCd: '7', basis: 'ml', kcalPer100: 19 }),
    row({ foodCd: 'D506-266000000-0001', originCd: '5', basis: 'ml', kcalPer100: 19 }),
  ];

  it('외식 분석값 행을 고르고, 식품 중량은 1회 분량으로 쓰지 않는다 (김치찌개)', () => {
    const pick = pickRow('FOOD', kimchiStew);

    expect(pick).toMatchObject({ kind: 'FOUND', gramsPerServing: null });
    expect(pick.kind === 'FOUND' && pick.row.foodCd).toBe('D306-266000000-0001');
  });

  it('외식 분석값이 없ㅇ므면 (급식 산출값만) 없음으로 본다', () => {
    expect(pickRow('FOOD', kimchiStew.slice(1))).toEqual({ kind: 'NONE' });
  });

  it('외식 분석값끼리 열량이 다르면 애매하다', () => {
    const rows = [
      row({ foodCd: 'A', originCd: '3', kcalPer100: 61 }),
      row({ foodCd: 'B', originCd: '3', kcalPer100: 80 }),
    ];

    expect(pickRow('FOOD', rows)).toEqual({ kind: 'AMBIGUOUS', candidates: 2 });
  });
});

describe('pickRow - 가공식품', () => {
  const processed = (foodCd: string, kcalPer100: number, sizeGrams: number | null) =>
    row({ dataset: 'PROCESSED', foodCd, kcalPer100, sizeGrams });

  it('여러 제품의 열량이 같으면 확정하고, 가장 흔한 포장 내용량을 1회 분량으로 쓴다(불닭볶음면)', () => {
    const rows = [
      processed('P108-009000400-0210', 379, 140),
      processed('P108-009000400-0194', 379, 700), // 5개입
      processed('P108-009000400-0021', 379, 140),
      processed('P108-009000400-0125', 379, 140),
    ];
    const pick = pickRow('PROCESSED', rows);

    expect(pick).toMatchObject({ kind: 'FOUND', gramsPerServing: 140 });
    expect(pick.kind === 'FOUND' && pick.row.sizeGrams).toBe(140);
  });

  it('제품이 하나뿐이면 대표값으로 보지 않는다 (닭가슴살 -> 양념육 1개)', () => {
    expect(pickRow('PROCESSED', [processed('P117-501050100-2870', 110, 100)])).toEqual({
      kind: 'AMBIGUOUS',
      candidates: 1,
    });
  });

  it('제품마다 열량이 다르면 애매하다 (콜라 24~45)', () => {
    const rows = [
      processed('C1', 38, null),
      processed('C2', 24, 1000),
      processed('C3', 45, 1500),
      processed('C4', 44, null),
    ];

    expect(pickRow('PROCESSED', rows)).toEqual({ kind: 'AMBIGUOUS', candidates: 4 });
  });

  it('포장 내용량이 동률이면 1회 분량을 비운다', () => {
    const rows = [processed('A', 379, 140), processed('B', 379, 700)];

    expect(pickRow('PROCESSED', rows)).toMatchObject({ kind: 'FOUND', gramsPerServing: null });
  });

  it('0건이면 없음', () => {
    expect(pickRow('PROCESSED', [])).toEqual({ kind: 'NONE' });
  });
});

describe('pickRow - 원재료', () => {
  const raw = (foodCd: string, foodNm: string, kcalPer100: number) =>
    row({ dataset: 'RAW', foodCd, foodNm, kcalPer100 });

  it('부위·조리 상태가 여러 개면 애매하다 (닭고기)', () => {
    const rows = [
      raw('R209-008000501-0000', '닭고기_가슴(껍질 제거)_생것', 106),
      raw('R209-008000546-0000', '닭고기_가슴(껍질 제거)_삶은것', 127),
      raw('R209-008000551-0000', '닭고기_가슴(껍질 제거)_구운것(팬)', 164),
    ];

    expect(pickRow('RAW', rows)).toEqual({ kind: 'AMBIGUOUS', candidates: 3 });
  });

  it('생것 · 말린것처럼 상태가 둘이어도 애매하다 (바나나)', () => {
    const rows = [
      raw('R108-037000001-0000', '바나나_생것', 77),
      raw('R108-037000002-0000', '바나나_말린것', 314),
    ];

    expect(pickRow('RAW', rows)).toEqual({ kind: 'AMBIGUOUS', candidates: 2 });
  });

  it('행이 하나면 확정한다 (원재료엔 1회 분량이 없음)', () => {
    const pick = pickRow('RAW', [raw('R1', '참외_생것', 31)]);

    expect(pick).toMatchObject({ kind: 'FOUND', gramsPerServing: null });
  });

  it('0건이면 없음', () => {
    expect(pickRow('RAW', [])).toEqual({ kind: 'NONE' });
  });
});
