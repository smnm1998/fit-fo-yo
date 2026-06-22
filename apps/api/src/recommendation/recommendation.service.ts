import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, RecordType } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIClient } from '../ai/openai.client';
import { DAILY_RECOMMENDATION_SYSTEM_PROMPT } from './prompts/daily-recommendation.system';

type DailySummary = {
  totalCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  exerciseMinutes: number;
  caloriesBurned: number;
  dietCount: number;
  exerciseCount: number;
};

type RecommendationFocus = 'diet' | 'exercise' | 'balanced';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly PROTEIN_TARGET_G = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIClient,
  ) {}

  /**
   * forDate(오늘)의 추천을 어제 기록 기반으로 생성 + upsert.
   * 어제 records 0건이면 skip (불필요한 OpenAI 호출 방지).
   */
  async generateForUser(userId: string, forDate: Date) {
    const targetDate = this.toKSTDateOnly(forDate);
    const { start, end } = this.yesterdayRange(targetDate);

    const records = await this.prisma.record.findMany({
      where: { userId, recordedAt: { gte: start, lte: end } },
      include: { dietItems: true, exerciseItems: true },
    });

    if (records.length === 0) {
      this.logger.debug(`skip user=${userId} (어제 기록 없음)`);
      return null;
    }

    const summary = this.aggregate(records);
    const focus = this.decideFocus(summary);
    const message = await this.buildMessage(summary, focus);

    const payload = { message, focus, summary } satisfies Prisma.InputJsonValue;

    return this.prisma.recommendation.upsert({
      where: { userId_forDate: { userId, forDate: targetDate } },
      create: { userId, forDate: targetDate, payload },
      update: { payload },
    });
  }

  /** 비-게스트 전체 유저 순회. 에러 격리(한 명 실패가 배치 전체를 멈추지 않음). */
  async runForAllUsers(forDate: Date) {
    const users = await this.prisma.user.findMany({
      where: { isGuest: false },
      select: { id: true },
    });

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const result = await this.generateForUser(user.id, forDate);
        if (result) created++;
        else skipped++;
      } catch (err) {
        failed++;
        this.logger.error(
          `추천 생성 실패 user=${user.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.log(
      `일일 정산 완료 forDate=${forDate.toISOString().slice(0, 10)} created=${created} skipped=${skipped} failed=${failed}`,
    );
    return { created, skipped, failed, total: users.length };
  }

  async getForDate(userId: string, forDate: Date) {
    const rec = await this.prisma.recommendation.findUnique({
      where: { userId_forDate: { userId, forDate } },
    });
    if (!rec) throw new NotFoundException('해당 날짜의 추천이 없습니다.');
    return rec;
  }

  async getRange(userId: string, from: Date, to: Date) {
    return this.prisma.recommendation.findMany({
      where: { userId, forDate: { gte: from, lte: to } },
      orderBy: { forDate: 'desc' },
    });
  }

  // ───────── helpers ─────────

  /** estimated 여부 무관하게 모든 수치 합산 (추정값도 통계에 포함 — 빈 데이터보다 가치 있음) */
  private aggregate(
    records: Prisma.RecordGetPayload<{
      include: { dietItems: true; exerciseItems: true };
    }>[],
  ): DailySummary {
    const s: DailySummary = {
      totalCalories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      exerciseMinutes: 0,
      caloriesBurned: 0,
      dietCount: 0,
      exerciseCount: 0,
    };

    for (const r of records) {
      if (r.type === RecordType.DIET) {
        for (const d of r.dietItems) {
          s.totalCalories += d.calories ?? 0;
          s.carbs += d.carbs ?? 0;
          s.protein += d.protein ?? 0;
          s.fat += d.fat ?? 0;
          s.dietCount++;
        }
      } else {
        for (const e of r.exerciseItems) {
          s.exerciseMinutes += e.durationMinutes ?? 0;
          s.caloriesBurned += e.caloriesBurned ?? 0;
          s.exerciseCount++;
        }
      }
    }
    return s;
  }

  private decideFocus(s: DailySummary): RecommendationFocus {
    const noExercise = s.exerciseMinutes === 0 && s.exerciseCount === 0;
    const lowProtein = s.protein < this.PROTEIN_TARGET_G;

    if (noExercise && s.dietCount > 0) return 'exercise';
    if (lowProtein && s.dietCount > 0) return 'diet';
    return 'balanced';
  }

  private async buildMessage(s: DailySummary, focus: RecommendationFocus): Promise<string> {
    const context = [
      `어제 기록 요약:`,
      `- 총 섭취 칼로리: ${s.totalCalories} kcal`,
      `- 탄수화물 ${s.carbs}g / 단백질 ${s.protein}g / 지방 ${s.fat}g`,
      `- 운동 시간: ${s.exerciseMinutes}분 (소모 ${s.caloriesBurned} kcal)`,
      `- 식단 ${s.dietCount}건 / 운동 ${s.exerciseCount}건`,
      ``,
      `오늘 중점(focus): ${focus}`,
    ].join('\n');

    const message = await this.openai.chatText({
      system: DAILY_RECOMMENDATION_SYSTEM_PROMPT,
      user: context,
    });

    return message || '어제 기록을 바탕으로 오늘도 균형 잡힌 식단과 가벼운 운동을 추천해요.';
  }

  private toKSTDateOnly(d: Date): Date {
    const KST = 9 * 60 * 60 * 1000;
    const k = new Date(d.getTime() + KST);
    return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
  }

  /**
   * forDate(KST 기준 날짜)의 "어제" 00:00:00 ~ 23:59:59.999 범위.
   */
  private yesterdayRange(forDate: Date): { start: Date; end: Date } {
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const kstNow = new Date(forDate.getTime() + KST_OFFSET_MS);
    const y = kstNow.getUTCFullYear();
    const m = kstNow.getUTCMonth();
    const d = kstNow.getUTCDate();

    const startKst = Date.UTC(y, m, d - 1, 0, 0, 0, 0);
    const endKst = Date.UTC(y, m, d - 1, 23, 59, 59, 999);
    return {
      start: new Date(startKst - KST_OFFSET_MS),
      end: new Date(endKst - KST_OFFSET_MS),
    };
  }
}
