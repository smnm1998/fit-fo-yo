import { describe, expect, it } from 'vitest';
import { RecordSchema } from '@/lib/schemas/api';

/** api가 실제로 돌려주는 기록 모양 (Prisma 행 그대로: 화면에 안 쓰는 필드와 null 포함) */
const apiRecord = {
  id: 'rec1',
  userId: 'user1',
  type: 'DIET',
  rawInput: '불닭볶음면 2봉 먹었어',
  parsedJson: { items: [] },
  recordedAt: '2026-11-24T03:00:00.000Z',
  createdAt: '2026-11-24T03:00:01.000Z',
  updatedAt: '2026-11-24T03:00:01.000Z',
  dietItems: [
    {
      id: 'item1',
      recordId: 'rec1',
      name: '불닭볶음면',
      mealType: null,
      quantity: 2,
      unit: '개',
      grams: 280,
      calories: 1061,
      carbs: null,
      protein: null,
      fat: null,
      estimated: false,
      createdAt: '2026-11-24T03:00:01.000Z',
    },
  ],
  exerciseItems: [],
};

describe('RecordSchema', () => {
  it('실제 api 응답을 통과시키고, 화면에서 안 쓰는 필드는 버린다', () => {
    const record = RecordSchema.parse(apiRecord);

    expect(record).not.toHaveProperty('userId');
    expect(record).not.toHaveProperty('parsedJson');
    expect(record.dietItems[0]).toMatchObject({
      name: '불닭볶음면',
      calories: 1061,
      mealType: null,
    });
  });

  it('recordedAt이 날짜가 아니면 거부한다 (달력에서 Invalid Date가 되기 전에)', () => {
    expect(RecordSchema.safeParse({ ...apiRecord, recordedAt: '2026-11-24' }).success).toBe(false);
    expect(RecordSchema.safeParse({ ...apiRecord, recordedAt: undefined }).success).toBe(false);
  });

  it('기록 하나가 올 자리에 배열이 오면 거부한다', () => {
    expect(RecordSchema.safeParse([apiRecord]).success).toBe(false);
  });
});
