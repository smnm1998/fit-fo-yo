import { Test } from '@nestjs/testing';
import { NutritionService, normalizeFoodName } from './nutrition.service';
import { PrismaService } from '../prisma/prisma.service';
import { MfdsClient, MfdsUnavailableError, type MfdsRow } from './mfds.client';

function mfdsRow(overrides: Partial<MfdsRow>): MfdsRow {
  return {
    dataset: 'PROCESSED',
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

/** 식약처 가공식품 실제 응답 (불닭볶음면: 379kcal/100g, 140g · 5개입 700g) */
const BULDAK = [
  mfdsRow({ foodCd: 'P108-009000400-0210', foodNm: '불닭볶음면', kcalPer100: 379, sizeGrams: 140 }),
  mfdsRow({ foodCd: 'P108-009000400-0021', foodNm: '불닭볶음면', kcalPer100: 379, sizeGrams: 140 }),
  mfdsRow({ foodCd: 'P108-009000400-0194', foodNm: '불닭볶음면', kcalPer100: 379, sizeGrams: 700 }),
];

describe('NutritionService', () => {
  let service: NutritionService;
  let prisma: {
    foodNutrition: { findMany: jest.Mock; upsert: jest.Mock };
    foodLookupMiss: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let mfds: { search: jest.Mock };

  beforeEach(async () => {
    prisma = {
      foodNutrition: {
        findMany: jest.fn().mockResolvedValue([]),
        // DB 가 저장한 행을 돌려주는 것을 흉내 낸다
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
      },
      foodLookupMiss: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    mfds = { search: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NutritionService,
        { provide: PrismaService, useValue: prisma },
        { provide: MfdsClient, useValue: mfds },
      ],
    }).compile();
    service = moduleRef.get(NutritionService);
  });

  it('normalizeFoodName: 공백 제거 + 소문자', () => {
    expect(normalizeFoodName(' 불닭 볶음면 ')).toBe('불닭볶음면');
    expect(normalizeFoodName('Americano')).toBe('americano');
  });

  describe('DB 에 있을 때', () => {
    it('정규화한 이름으로 찾고 식약처는 부르지 않는다', async () => {
      prisma.foodNutrition.findMany.mockResolvedValue([
        { name: '불닭볶음면', caloriesPer100g: 379, gramsPerServing: 140 },
      ]);

      const map = await service.lookupMany(['불닭 볶음면']);

      expect(prisma.foodNutrition.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['불닭볶음면'] } },
      });
      expect(map.get('불닭볶음면')?.caloriesPer100g).toBe(379);
      expect(mfds.search).not.toHaveBeenCalled();
    });

    it('빈 이름만 있으면 쿼리 없이 빈 Map', async () => {
      const map = await service.lookupMany(['', '  ']);

      expect(prisma.foodNutrition.findMany).not.toHaveBeenCalled();
      expect(map.size).toBe(0);
    });
  });

  describe('DB 에 없을 때 — 식약처 조회', () => {
    it('찾으면 저장하고 결과에 담는다 (음식 0건 → 가공식품에서 확정)', async () => {
      mfds.search.mockImplementation((dataset: string) =>
        Promise.resolve(dataset === 'PROCESSED' ? BULDAK : []),
      );

      const map = await service.lookupMany(['불닭 볶음면']);

      // 원래 표기로 묻고, 확정된 뒤에는 원재료를 조회하지 않는다
      expect(mfds.search.mock.calls).toEqual([
        ['FOOD', '불닭 볶음면'],
        ['PROCESSED', '불닭 볶음면'],
      ]);
      expect(prisma.foodNutrition.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: '불닭볶음면' },
          create: expect.objectContaining({
            foodCd: 'P108-009000400-0210',
            caloriesPer100g: 379,
            gramsPerServing: 140,
          }),
        }),
      );
      expect(prisma.foodLookupMiss.deleteMany).toHaveBeenCalledWith({
        where: { name: '불닭볶음면' },
      });
      expect(map.get('불닭볶음면')).toMatchObject({ caloriesPer100g: 379, gramsPerServing: 140 });
    });

    it('같은 음식이 여러 번 들어와도 한 번만 조회한다', async () => {
      await service.lookupMany(['불닭볶음면', '불닭 볶음면', '불닭볶음면']);

      // 이름 1개 × 데이터셋 3개 (전부 0건이라 끝까지 조회)
      expect(mfds.search).toHaveBeenCalledTimes(3);
    });

    it('후보가 애매하면 AMBIGUOUS 로 기록하고 뒤 데이터셋은 보지 않는다', async () => {
      mfds.search.mockResolvedValue([
        mfdsRow({ dataset: 'FOOD', foodCd: 'A', originCd: '3', kcalPer100: 61 }),
        mfdsRow({ dataset: 'FOOD', foodCd: 'B', originCd: '3', kcalPer100: 80 }),
      ]);

      const map = await service.lookupMany(['김치찌개']);

      expect(mfds.search).toHaveBeenCalledTimes(1);
      expect(prisma.foodLookupMiss.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { name: '김치찌개', reason: 'AMBIGUOUS' } }),
      );
      expect(prisma.foodNutrition.upsert).not.toHaveBeenCalled();
      expect(map.has('김치찌개')).toBe(false);
    });

    it('세 데이터셋 모두 0건이면 NOT_FOUND 로 기록한다', async () => {
      const map = await service.lookupMany(['할머니표 수제비']);

      expect(mfds.search).toHaveBeenCalledTimes(3);
      expect(prisma.foodLookupMiss.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { name: '할머니표수제비', reason: 'NOT_FOUND' } }),
      );
      expect(map.size).toBe(0);
    });
  });

  describe('식약처 장애', () => {
    it('못 찾음으로 기록하지 않고 빈 결과를 돌려준다 (다음 요청에서 재시도)', async () => {
      mfds.search.mockRejectedValue(new MfdsUnavailableError('[FOOD] 요청 실패 (TimeoutError)'));

      const map = await service.lookupMany(['김치찌개']);

      expect(map.size).toBe(0);
      expect(prisma.foodLookupMiss.upsert).not.toHaveBeenCalled();
      expect(prisma.foodNutrition.upsert).not.toHaveBeenCalled();
    });

    it('한 음식의 장애가 다른 음식의 결과를 막지 않는다', async () => {
      mfds.search.mockImplementation((dataset: string, query: string) => {
        if (query === '김치찌개') return Promise.reject(new MfdsUnavailableError('장애'));
        return Promise.resolve(dataset === 'PROCESSED' ? BULDAK : []);
      });

      const map = await service.lookupMany(['김치찌개', '불닭볶음면']);

      expect(map.has('김치찌개')).toBe(false);
      expect(map.get('불닭볶음면')?.caloriesPer100g).toBe(379);
    });
  });

  describe('못 찾음 캐시', () => {
    afterEach(() => jest.useRealTimers());

    it('최근 30일 안에 못 찾은 이름은 다시 묻지 않고 요청 횟수만 올린다', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-12T00:00:00Z'));
      prisma.foodLookupMiss.findMany.mockResolvedValue([{ name: '할머니표수제비' }]);

      await service.lookupMany(['할머니표 수제비']);

      expect(prisma.foodLookupMiss.findMany).toHaveBeenCalledWith({
        where: {
          name: { in: ['할머니표수제비'] },
          checkedAt: { gte: new Date('2026-09-12T00:00:00Z') },
        },
        select: { name: true },
      });
      expect(mfds.search).not.toHaveBeenCalled();
      expect(prisma.foodLookupMiss.updateMany).toHaveBeenCalledWith({
        where: { name: { in: ['할머니표수제비'] } },
        data: { requestCount: { increment: 1 } },
      });
    });
  });

  describe('추정값 기억', () => {
    const ESTIMATE = { caloriesPer100g: 150, gramsPerServing: 400 };

    it('못 찾음으로 기록된 이름 중 아직 값이 없는 행만 채운다. (처음 값이 이김)', async () => {
      await service.rememberEstimates(new Map([['엽기떡볶이', ESTIMATE]]));

      expect(prisma.foodLookupMiss.updateMany).toHaveBeenCalledWith({
        where: { name: '엽기떡볶이', caloriesPer100g: null },
        data: ESTIMATE,
      });
    });

    it('저장에 실패해도 던지지 않는다.', async () => {
      prisma.foodLookupMiss.updateMany.mockRejectedValue(new Error('db down'));

      await expect(
        service.rememberEstimates(new Map([['엽기떡볶이', ESTIMATE]])),
      ).resolves.toBeUndefined();
    });

    it('기억해 둔 값을 정규화 이름으로 돌려준다.', async () => {
      prisma.foodLookupMiss.findMany.mockResolvedValue([{ name: '엽기떡볶이', ...ESTIMATE }]);

      const estimates = await service.findEstimates(['엽기 떡볶이', '없는음식']);

      expect(estimates).toEqual(new Map([['엽기떡볶이', ESTIMATE]]));
      expect(prisma.foodLookupMiss.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { in: ['엽기떡볶이', '없는음식'] }, caloriesPer100g: { not: null } },
        }),
      );
    });
  });
});
