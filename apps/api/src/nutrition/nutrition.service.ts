import { Injectable, Logger } from '@nestjs/common';
import { FoodLookupMissReason, type FoodNutrition } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';
import { MfdsClient, MfdsUnavailableError, type MfdsDataset, type MfdsRow } from './mfds.client';
import { pickRow } from './mfds.select';

/** 저장, 조회 모두 이 함수로 이름을 정규화한다 (공백 제거 + 소문자) */
export function normalizeFoodName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

/** 식약처에 없는 음식에 처음 쓴 AI 추정값 (같은 음식이 기록마다 다른 칼로리가 되지 않게) */
export type FoodEstimate = { caloriesPer100g: number; gramsPerServing: number | null };

/** 식약처에서 못 찾은 이름을 다시 묻지 않는 기간 */
const MISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 조회 순서, 후보가 처음 나온 데이터셋이 결론을 냄 */
const DATASET_ORDER: MfdsDataset[] = ['FOOD', 'PROCESSED', 'RAW'];

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mfds: MfdsClient,
  ) {}

  /**
   * 음식명들을 조회해 정규화 이름 -> FoodNutrition Map으로 반환 (read-through 캐시)
   * - DB에 없으면 그 값
   * - 없으면 식약처에서 찾아 저장한 뒤 반환
   * - 못 찾은 이름은 Map에 없다 -> 호출 측이 AI 추정으로 처리
   */
  async lookupMany(names: string[]): Promise<Map<string, FoodNutrition>> {
    // 정규화 이름 -> 원래 표기 (식약처는 완전 일치 검색이라 원래 표기로 물음)
    const queries = new Map<string, string>();
    for (const raw of names) {
      const key = normalizeFoodName(raw);
      if (key && !queries.has(key)) queries.set(key, raw.trim());
    }
    if (queries.size === 0) return new Map();

    const keys = [...queries.keys()];
    const cached = await this.prisma.foodNutrition.findMany({ where: { name: { in: keys } } });
    const table = new Map(cached.map((r) => [r.name, r]));

    const missing = keys.filter((key) => !table.has(key));
    if (missing.length === 0) return table;

    const pending = await this.skipRecentMisses(missing);
    const resolved = await Promise.all(
      pending.map(async (key) => [key, await this.resolve(key, queries.get(key) ?? key)] as const),
    );
    for (const [key, row] of resolved) {
      if (row) table.set(key, row);
    }
    return table;
  }

  /**
   * 식약처에 없는 음식에 처음 쓴 추정값 (정규화 이름 -> 값)
   * 기억해 둔 값이 없으면 Map에 없음
   */
  async findEstimates(names: string[]): Promise<Map<string, FoodEstimate>> {
    const keys = [...new Set(names.map(normalizeFoodName))].filter(Boolean);
    if (keys.length === 0) return new Map();

    const rows = await this.prisma.foodLookupMiss.findMany({
      where: { name: { in: keys }, caloriesPer100g: { not: null } },
      select: { name: true, caloriesPer100g: true, gramsPerServing: true },
    });

    const estimates = new Map<string, FoodEstimate>();
    for (const row of rows) {
      if (row.caloriesPer100g === null) continue;
      estimates.set(row.name, {
        caloriesPer100g: row.caloriesPer100g,
        gramsPerServing: row.gramsPerServing,
      });
    }
    return estimates;
  }

  /**
   * 처음 쓴 추정값을 기억함
   * - 식약처에서 못 찾았다고 기록된 이름에만, 아직 값이 없을 때만 채움 (처음 값이 이김)
   * - 실패해도 던지지 않음 (기록 저장을 막으면 안됨)
   */
  async rememberEstimates(estimates: Map<string, FoodEstimate>): Promise<void> {
    try {
      await Promise.all(
        [...estimates].map(([name, estimate]) =>
          this.prisma.foodLookupMiss.updateMany({
            where: { name, caloriesPer100g: null },
            data: estimate,
          }),
        ),
      );
    } catch (e) {
      this.logger.warn(`추정값 저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /** 최근에 못 찾은 이름은 다시 묻지 않음. 식약처에 물어볼 이름만 돌려준다 */
  private async skipRecentMisses(keys: string[]): Promise<string[]> {
    const recent = await this.prisma.foodLookupMiss.findMany({
      where: { name: { in: keys }, checkedAt: { gte: new Date(Date.now() - MISS_TTL_MS) } },
      select: { name: true },
    });
    if (recent.length === 0) return keys;

    const skip = new Set(recent.map((m) => m.name));

    await this.prisma.foodLookupMiss.updateMany({
      where: { name: { in: [...skip] } },
      data: { requestCount: { increment: 1 } },
    });
    return keys.filter((key) => !skip.has(key));
  }

  /** 식약처에서 찾아 저장. 실패해도 던지지 않음(영양 조회가 기록 저장을 막으면 안됨)
   * - 못 찾음/애매함 -> 기록을 남기고 null
   * - 장애 -> 기록 없이 null (다음 요청에서 다시 시도)
   */
  private async resolve(key: string, query: string): Promise<FoodNutrition | null> {
    try {
      for (const dataset of DATASET_ORDER) {
        const pick = pickRow(dataset, await this.mfds.search(dataset, query));
        if (pick.kind === 'NONE') continue;
        if (pick.kind === 'AMBIGUOUS') {
          await this.recordMiss(key, FoodLookupMissReason.AMBIGUOUS);
          return null;
        }
        return await this.save(key, pick.row, pick.gramsPerServing);
      }
      await this.recordMiss(key, FoodLookupMissReason.NOT_FOUND);
      return null;
    } catch (e) {
      if (e instanceof MfdsUnavailableError) {
        this.logger.warn(e.message);
      } else {
        this.logger.error(`"${query}" 영양 조회 중 예상하지 못한 오류`, e);
      }
      return null;
    }
  }

  private async save(
    key: string,
    row: MfdsRow,
    gramsPerServing: number | null,
  ): Promise<FoodNutrition> {
    const data = {
      foodCd: row.foodCd,
      foodNm: row.foodNm,
      caloriesPer100g: row.kcalPer100,
      gramsPerServing,
      referenceDate: row.referenceDate,
    };
    // 같은 이름을 동시에 처음 조회한 요청이 둘이어도 upsert라 한 행만 남음
    const saved = await this.prisma.foodNutrition.upsert({
      where: { name: key },
      create: { name: key, ...data },
      update: data,
    });
    // 에전에 못 찾았던 이름이면 그 기록을 지움 (못 찾음 목록 = 아직 비어 있는 음식)
    await this.prisma.foodLookupMiss.deleteMany({ where: { name: key } });
    return saved;
  }

  private async recordMiss(key: string, reason: FoodLookupMissReason): Promise<void> {
    await this.prisma.foodLookupMiss.upsert({
      where: { name: key },
      create: { name: key, reason },
      update: { reason, checkedAt: new Date(), requestCount: { increment: 1 } },
    });
  }
}
