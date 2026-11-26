import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, RecordType } from '@fitfoyo/database';
import { RecordsService } from '../records/records.service';
import type { UpdateRecordDto } from '../records/dto/update-record.dto';
import { NutritionService } from '../nutrition/nutrition.service';
import { HealthProfileService } from '../health-profile/health-profile.service';
import type {
  ParsedDietPayload,
  ParsedExercisePayload,
  UpdateRecordPayload,
} from './schemas/function-schemas';
import {
  DEFAULT_WEIGHT_KG,
  newEstimates,
  toDietItemInput,
  toExerciseItemInput,
  toMealType,
} from './calorie.calculator';
import { planDiet } from './diet.planner';
import { dayRangeKST } from './day-context';
import { toValidDate } from './tool-args';

/** 모델이 파싱한 식단/운동을 칼로리 계산해 기록으로 쓴다 (새로 만들기, 같은 끼니에 덧붙이기, 수정) */
@Injectable()
export class RecordWriter {
  constructor(
    private readonly records: RecordsService,
    private readonly nutrition: NutritionService,
    private readonly healthProfile: HealthProfileService,
  ) {}

  async createDiet(userId: string, payload: ParsedDietPayload, recordedAt: Date, rawInput: string) {
    return this.records.createFromParsed({
      userId,
      type: RecordType.DIET,
      rawInput,
      parsedJson: payload as unknown as Prisma.InputJsonValue,
      recordedAt,
      dietItems: await this.toDietItems(payload.items),
    });
  }

  async createExercise(
    userId: string,
    payload: ParsedExercisePayload,
    recordedAt: Date,
    rawInput: string,
    weightKg: number,
  ) {
    return this.records.createFromParsed({
      userId,
      type: RecordType.EXERCISE,
      rawInput,
      parsedJson: payload as unknown as Prisma.InputJsonValue,
      recordedAt,
      exerciseItems: payload.items.map((item) => toExerciseItemInput(item, weightKg)),
    });
  }

  /**
   * 채팅의 식단 기록
   * 그 날의 식단과 대조한 뒤 처리 (planDiet)
   * - 새 기록 만들기 / 같은 끼니 기록에 덧붙이기 / 전부 이미 있으면 기록하지 않기
   * summary는 2차 응답을 만드는 모델이 읽는다
   */
  async recordDiet(
    userId: string,
    payload: ParsedDietPayload,
    recordedAt: Date,
    rawInput: string,
  ): Promise<{
    summary: string;
    created?: Awaited<ReturnType<RecordsService['createFromParsed']>>;
    updated?: Awaited<ReturnType<RecordsService['appendDietItems']>>;
  }> {
    const { from, to } = dayRangeKST(recordedAt.toISOString());
    const { items: day } = await this.records.findAll(userId, {
      type: RecordType.DIET,
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 50,
      offset: 0,
    });

    // 'NONE' 같은 값을 먼저 정리해야 끼니 비교가 맞음
    const items = payload.items.map((item) => ({ ...item, mealType: toMealType(item.mealType) }));
    const plan = planDiet(day, items, payload.again === true);

    const skipped = plan.skipped.length
      ? ` 이미 기록돼 있어 넣지 않은 항목: ${plan.skipped.join(', ')}`
      : '';

    switch (plan.kind) {
      case 'SKIP':
        return { summary: skipped ? `기록하지 않음.${skipped}` : '기록할 음식이 없음' };

      case 'APPEND': {
        const rec = await this.records.appendDietItems(
          userId,
          plan.recordId,
          await this.toDietItems(plan.items),
          rawInput,
        );
        const names = plan.items.map((i) => i.name).join(', ');
        return {
          updated: rec,
          summary: `기존 식단 기록에 추가 완료 (id=${rec.id}): ${names}.${skipped}`,
        };
      }

      case 'CREATE': {
        const rec = await this.createDiet(
          userId,
          { ...payload, items: plan.items },
          recordedAt,
          rawInput,
        );
        return { created: rec, summary: `식단 등록 완료 (id=${rec.id}).${skipped}` };
      }
    }
  }

  async update(userId: string, payload: UpdateRecordPayload) {
    const dto: UpdateRecordDto = {};
    if (payload.recordedAt) {
      const recordedAt = toValidDate(payload.recordedAt);
      if (!recordedAt) throw new BadRequestException(`날짜 형식 오류: ${payload.recordedAt}`);
      dto.recordedAt = recordedAt.toISOString();
    }
    if (payload.dietItems) dto.dietItems = await this.toDietItems(payload.dietItems);
    return this.records.update(userId, payload.recordId, dto);
  }

  /** 운동 소모 칼로리용 체중. 프로필에 없으면 기본값 */
  async loadWeightKg(userId: string): Promise<number> {
    const profile = await this.healthProfile.get(userId);
    const weight = profile?.weightKg;
    return typeof weight === 'number' && weight > 0 ? weight : DEFAULT_WEIGHT_KG;
  }

  /**
   * 식단 항목 -> 저장할 값
   * 식약처 값 -> 기억해 둔 추정값 -> 이번 AI 추정값 순서로 계산하고, 처음 본 추정값은 기억
   * (같은 음식이 대화 맥락에 따라 기록마다 다른 칼로리가 되지 않게)
   */
  private async toDietItems(items: ParsedDietPayload['items']) {
    const names = items.map((i) => i.name);
    const [table, estimates] = await Promise.all([
      this.nutrition.lookupMany(names),
      this.nutrition.findEstimates(names),
    ]);
    await this.nutrition.rememberEstimates(newEstimates(items, table, estimates));
    return items.map((item) => toDietItemInput(item, table, estimates));
  }
}
