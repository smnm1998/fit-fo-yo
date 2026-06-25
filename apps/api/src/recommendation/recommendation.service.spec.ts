import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecordType } from '@fitfoyo/database';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIClient } from '../ai/openai.client';

/** DIET record 한 건 생성 헬퍼 */
function dietRecord(
  items: Array<Partial<{ calories: number; protein: number; carbs: number; fat: number }>>,
) {
  return {
    type: RecordType.DIET,
    dietItems: items.map((i) => ({
      calories: i.calories ?? 0,
      protein: i.protein ?? 0,
      carbs: i.carbs ?? 0,
      fat: i.fat ?? 0,
    })),
    exerciseItems: [],
  };
}

function exerciseRecord(
  items: Array<Partial<{ durationMinutes: number; caloriesBurned: number }>>,
) {
  return {
    type: RecordType.EXERCISE,
    dietItems: [],
    exerciseItems: items.map((i) => ({
      durationMinutes: i.durationMinutes ?? 0,
      caloriesBurned: i.caloriesBurned ?? 0,
    })),
  };
}

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prisma: {
    record: { findMany: jest.Mock };
    recommendation: { upsert: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    healthProfile: { findUnique: jest.Mock };
    user: { findMany: jest.Mock };
  };

  let openai: { chatText: jest.Mock };

  beforeEach(async () => {
    prisma = {
      record: { findMany: jest.fn() },
      recommendation: {
        upsert: jest.fn((x) => Promise.resolve({ id: 'r1', ...x.create })),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      healthProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      user: { findMany: jest.fn() },
    };

    openai = { chatText: jest.fn().mockResolvedValue('오늘은 단백질을 늘려보세요!') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: prisma },
        { provide: OpenAIClient, useValue: openai },
      ],
    }).compile();

    service = moduleRef.get(RecommendationService);
  });

  const forDate = new Date('2026-06-01T00:00:00Z');

  describe('generateForUser', () => {
    it('어제 기록 0건이면 null 반환 + OpenAI 호출 안 함 (skip)', async () => {
      prisma.record.findMany.mockResolvedValue([]);

      const result = await service.generateForUser('u1', forDate);

      expect(result).toBeNull();
      expect(openai.chatText).not.toHaveBeenCalled();
      expect(prisma.recommendation.upsert).not.toHaveBeenCalled();
    });

    it('운동은 했지만 단백질 부족하면 focus=diet', async () => {
      prisma.record.findMany.mockResolvedValue([
        dietRecord([{ calories: 500, protein: 20 }]),
        exerciseRecord([{ durationMinutes: 30, caloriesBurned: 200 }]),
      ]);

      await service.generateForUser('u1', forDate);

      const payload = prisma.recommendation.upsert.mock.calls[0][0].create.payload;
      expect(payload.focus).toBe('diet');
      expect(payload.summary.protein).toBe(20);
      expect(payload.summary.exerciseMinutes).toBe(30);
    });

    it('운동 0 + 식단 있으면 focus=exercise', async () => {
      prisma.record.findMany.mockResolvedValue([
        dietRecord([{ calories: 800, protein: 70 }]), // protein 충분, 운동 없음
      ]);

      await service.generateForUser('u1', forDate);

      const payload = prisma.recommendation.upsert.mock.calls[0][0].create.payload;
      expect(payload.focus).toBe('exercise');
    });

    it('단백질 충분 + 운동 있으면 focus=balanced', async () => {
      prisma.record.findMany.mockResolvedValue([
        dietRecord([{ calories: 800, protein: 70 }]),
        exerciseRecord([{ durationMinutes: 30, caloriesBurned: 250 }]),
      ]);

      await service.generateForUser('u1', forDate);

      const payload = prisma.recommendation.upsert.mock.calls[0][0].create.payload;
      expect(payload.focus).toBe('balanced');
      expect(payload.summary.exerciseMinutes).toBe(30);
    });

    it('upsert 로 저장 (idempotent — userId_forDate 키 사용)', async () => {
      prisma.record.findMany.mockResolvedValue([dietRecord([{ calories: 300, protein: 10 }])]);

      await service.generateForUser('u1', forDate);

      const callArg = prisma.recommendation.upsert.mock.calls[0][0];
      expect(callArg.where).toEqual({ userId_forDate: { userId: 'u1', forDate } });
      expect(callArg.create).toBeDefined();
      expect(callArg.update).toBeDefined();
    });
  });

  describe('runForAllUsers', () => {
    it('한 유저 실패해도 나머지는 계속 처리 (에러 격리)', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
      // u1 성공, u2 실패(findMany throw), u3 skip(빈 기록)
      prisma.record.findMany
        .mockResolvedValueOnce([dietRecord([{ calories: 300, protein: 10 }])]) // u1
        .mockRejectedValueOnce(new Error('DB error')) // u2
        .mockResolvedValueOnce([]); // u3

      const result = await service.runForAllUsers(forDate);

      expect(result).toEqual({ created: 1, skipped: 1, failed: 1, total: 3 });
    });
  });

  describe('getForDate', () => {
    it('추천 없으면 NotFoundException', async () => {
      prisma.recommendation.findUnique.mockResolvedValue(null);

      await expect(service.getForDate('u1', forDate)).rejects.toThrow(NotFoundException);
    });
  });
});
