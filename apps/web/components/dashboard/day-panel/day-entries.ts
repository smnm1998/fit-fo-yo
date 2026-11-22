import { MEAL_LABEL, MEAL_ORDER } from '@/lib/record-meta';
import type { RecordDto } from '@/lib/types';

export type DayFilterValue = 'ALL' | 'DIET' | 'EXERCISE';

export type DayEntry = {
  key: string;
  kind: 'DIET' | 'EXERCISE';
  tag: string;
  name: string;
  kcal: number;
  estimated: boolean;
  records: RecordDto[];
};

function withMore(first: string, count: number): string {
  return count > 1 ? `${first} 외 ${count - 1}개` : first;
}

/** 식단은 끼니로 묶는다. (한 끼에 여러 기록이 있어도 한 줄) */
function dietEntries(records: RecordDto[]): DayEntry[] {
  const groups = new Map<string, { record: RecordDto; item: RecordDto['dietItems'][number] }[]>();

  for (const record of records) {
    for (const item of record.dietItems) {
      const meal = item.mealType ?? 'ETC';
      const cell = groups.get(meal);
      if (cell) cell.push({ record, item });
      else groups.set(meal, [{ record, item }]);
    }
  }

  return MEAL_ORDER.filter((meal) => groups.get(meal)?.length).map((meal) => {
    const cell = groups.get(meal) ?? [];
    return {
      key: `meal:${meal}`,
      kind: 'DIET' as const,
      tag: MEAL_LABEL[meal] ?? '기타',
      name: withMore(cell[0]?.item.name ?? '', cell.length),
      kcal: cell.reduce((sum, e) => sum + (e.item.calories ?? 0), 0),
      estimated: cell.some((e) => e.item.estimated),
      records: Array.from(new Set(cell.map((e) => e.record))),
    };
  });
}

/** 운동은 기록 단위 그대로 */
function exerciseEntries(records: RecordDto[]): DayEntry[] {
  return records.map((record) => {
    const items = record.exerciseItems;
    const first = items[0];
    const base = first?.name ?? '운동';

    return {
      key: `rec:${record.id}`,
      kind: 'EXERCISE' as const,
      tag: '운동',
      name:
        items.length > 1
          ? withMore(base, items.length)
          : first?.durationMinutes
            ? `${base} ${first?.durationMinutes}분`
            : base,
      kcal: items.reduce((sum, it) => sum + (it.caloriesBurned ?? 0), 0),
      estimated: items.some((it) => it.estimated),
      records: [record],
    };
  });
}

/**
 * 하루 기록을 행 목록으로
 * 총합은 시간순이 아닌 끼니 순서 뒤에 운동을 붙임
 * 기록 시각은 사용자가 실제로 먹은 시각과 다를 수 있음 (AI 정적 채움)
 * 시간순 정렬은 오히려 뒤섞여 보일 것 같음
 */
export function buildDayEntries(dayRecords: RecordDto[], filter: DayFilterValue): DayEntry[] {
  const diet = dayRecords.filter((r) => r.type === 'DIET');
  const exercise = dayRecords.filter((r) => r.type === 'EXERCISE');

  if (filter === 'DIET') return dietEntries(diet);
  if (filter === 'EXERCISE') return exerciseEntries(exercise);
  return [...dietEntries(diet), ...exerciseEntries(exercise)];
}
