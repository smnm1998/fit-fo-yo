import { Injectable } from '@nestjs/common';
import type { FoodNutrition } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';

/** seed.ts 의 normalize 와 반드시 동일 로직 */
export function normalizeFoodName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 음식명들을 배치 조회해 정규화 이름 → FoodNutrition Map 으로 반환 */
  async lookupMany(names: string[]): Promise<Map<string, FoodNutrition>> {
    const keys = [...new Set(names.map(normalizeFoodName).filter(Boolean))];
    if (keys.length === 0) return new Map();

    const rows = await this.prisma.foodNutrition.findMany({
      where: { name: { in: keys } },
    });
    return new Map(rows.map((r) => [r.name, r]));
  }
}
