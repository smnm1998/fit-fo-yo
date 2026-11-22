import { recordName, recordTotalKcal, recordMealLabel } from '@/lib/record-meta';
import type { ChatCard } from '@/lib/store/chat-store';
import type { RecordDto } from '@/lib/types';

/** 생성-수정된 기록 (말풍선 아래 카드) */
export function dtoToCard(record: RecordDto, kind: 'created' | 'updated'): ChatCard {
  const items = record.type === 'DIET' ? record.dietItems : record.exerciseItems;
  const estimated = items.some((i) => i.estimated);

  if (record.type === 'DIET') {
    return {
      kind,
      type: 'DIET',
      name: recordName(record),
      meal: recordMealLabel(record),
      detail: `${recordTotalKcal(record)} kcal`,
      estimated,
    };
  }

  const minutes = record.exerciseItems.reduce((sum, i) => sum + (i.durationMinutes ?? 0), 0);
  return {
    kind,
    type: 'EXERCISE',
    name: recordName(record),
    detail: `${minutes}분 - ${recordTotalKcal(record)} kcal 소요`,
  };
}

/** 삭제된 기록 -> '삭제됨' 카드. 스토어에서 지우기 전의 스냅샷으로 만듦 */
export function removedCard(record: RecordDto): ChatCard {
  return {
    kind: 'removed',
    type: record.type,
    name: recordName(record),
    detail: '기록에서 삭제됨',
  };
}
