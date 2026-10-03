import { Injectable } from '@nestjs/common';
import type { FoodNutrition } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';

/** 저장, 조회 모두 이 함수로 이름을 정규화한다 (공백 제거 + 소문자) */
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
