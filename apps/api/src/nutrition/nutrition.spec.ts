import { Test } from '@nestjs/testing';
import { NutritionService, normalizeFoodName } from './nutrition.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NutritionService', () => {
  let service: NutritionService;
  let prisma: { foodNutrition: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { foodNutrition: { findMany: jest.fn().mockResolvedValue([]) } };
    const moduleRef = await Test.createTestingModule({
      providers: [NutritionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(NutritionService);
  });

  it('normalizeFoodName: 공백 제거 + 소문자 (seed.ts normalize 와 동일)', () => {
    expect(normalizeFoodName(' 불닭 볶음면 ')).toBe('불닭볶음면');
    expect(normalizeFoodName('Americano')).toBe('americano');
  });

  it('정규화된 이름으로 조회하고 정규화 이름 → row Map 으로 반환한다', async () => {
    prisma.foodNutrition.findMany.mockResolvedValue([
      { name: '불닭볶음면', caloriesPer100g: 408, gramsPerServing: 130 },
    ]);

    const map = await service.lookupMany(['불닭 볶음면']);

    expect(prisma.foodNutrition.findMany).toHaveBeenCalledWith({
      where: { name: { in: ['불닭볶음면'] } },
    });
    expect(map.get('불닭볶음면')?.caloriesPer100g).toBe(408);
  });

  it('중복 이름은 한 번만 조회한다 (Set 중복 제거)', async () => {
    await service.lookupMany(['불닭볶음면', '불닭 볶음면', '불닭볶음면']);

    expect(prisma.foodNutrition.findMany).toHaveBeenCalledWith({
      where: { name: { in: ['불닭볶음면'] } },
    });
  });

  it('빈 이름만 있으면 쿼리 없이 빈 Map', async () => {
    const map = await service.lookupMany(['', '  ']);
    expect(prisma.foodNutrition.findMany).not.toHaveBeenCalled();
    expect(map.size).toBe(0);
  });
});
