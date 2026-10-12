import type { MfdsDataset, MfdsRow } from './mfds.client';

/** 한 데이터셋의 후보들에 대한 판단 */
export type MfdsPick =
  | { kind: 'FOUND'; row: MfdsRow; gramsPerServing: number | null }
  | { kind: 'AMBIGUOUS'; candidates: number }
  | { kind: 'NONE' };

/** 후보들의 열량이 모두 같은가 */
function sameKcal(rows: MfdsRow[]): boolean {
  return rows.every((r) => r.kcalPer100 === rows[0].kcalPer100);
}

/** 가장 많이 나온 식품 중량 (없거나 동률이면 null) */
function mostCommonSize(rows: MfdsRow[]): number | null {
  const counts = new Map<number, number>();
  for (const r of rows) {
    if (r.sizeGrams !== null) counts.set(r.sizeGrams, (counts.get(r.sizeGrams) ?? 0) + 1);
  }

  const ranked = [...counts].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

/** 음식: 외식 분석값(3) · 100g 기준만 쓴다 */
function pickFood(rows: MfdsRow[]): MfdsPick {
  // 급식 산출값은 100ml 기준이고 수분값이 실제와 맞지 않아 제외 (쌀밥 4.3 vs 분석 58.9)
  const analyzed = rows.filter((r) => r.originCd === '3' && r.basis === 'g');
  if (analyzed.length === 0) return { kind: 'NONE' };
  if (!sameKcal(analyzed)) return { kind: 'AMBIGUOUS', candidates: analyzed.length };

  // 음식의 식품 중량은 분석에 쓴 양일 수 있어 1회 분량으로 쓰지 않는다 (쌀밥 100g)
  return { kind: 'FOUND', row: analyzed[0], gramsPerServing: null };
}

/** 가공식품: 서로 다른 제품 2개 이상이 같은 열량일 때만 */
function pickProcessed(rows: MfdsRow[]): MfdsPick {
  if (rows.length === 0) return { kind: 'NONE' };
  // 제품이 하나뿐이면 그 제품이 이 이름을 대표한다고 보기 어렵다 (닭가슴살 → 양념육 1개)
  if (rows.length === 1 || !sameKcal(rows)) {
    return { kind: 'AMBIGUOUS', candidates: rows.length };
  }

  const size = mostCommonSize(rows);
  const row = rows.find((r) => r.sizeGrams === size) ?? rows[0];
  return { kind: 'FOUND', row, gramsPerServing: size };
}

/** 원재료: 행이 하나일 때만 (부위 · 조리 상태는 사람이 정할 일) */
function pickRaw(rows: MfdsRow[]): MfdsPick {
  if (rows.length === 0) return { kind: 'NONE' };
  if (rows.length > 1) return { kind: 'AMBIGUOUS', candidates: rows.length };
  return { kind: 'FOUND', row: rows[0], gramsPerServing: null };
}

const PICKERS: Record<MfdsDataset, (rows: MfdsRow[]) => MfdsPick> = {
  FOOD: pickFood,
  PROCESSED: pickProcessed,
  RAW: pickRaw,
};

/** 한 데이터셋에서 받아 온 후보 중 하나로 확정할 수 있는지 판단한다 */
export function pickRow(dataset: MfdsDataset, rows: MfdsRow[]): MfdsPick {
  return PICKERS[dataset](rows);
}
