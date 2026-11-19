import { RecordType, type MealType } from '@fitfoyo/database';
import type { RecordsService } from '../records/records.service';

const KST = 9 * 60 * 60 * 1000;

const MEAL_LABEL: Record<MealType, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
};

type DayRecords = Awaited<ReturnType<RecordsService['findAll']>>['items'];

/** recordedAt(없으면 지금)이 속한 KST 하루의 시작, 끝을 UTC Date로 */
export function dayRangeKST(recordedAt?: string): { from: Date; to: Date } {
  const base = recordedAt ? new Date(recordedAt) : new Date();
  const k = new Date(base.getTime() + KST);
  const y = k.getUTCFullYear();
  const m = k.getUTCMonth();
  const d = k.getUTCDate();
  return {
    from: new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - KST),
    to: new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - KST),
  };
}

/**
 * KST 기준 'YYYY-MM-DD' (요일)
 * dayRangeKST와 같은 방식(UTC에 +9h)으로 계산해 두 곳의 날짜 해석이 어긋나지 않게 한다
 */
function kstDateLabel(date: Date): string {
  const k = new Date(date.getTime() + KST);
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, '0');
  const d = String(k.getUTCDate()).padStart(2, '0');
  const dow = ['일', '월', '화', '수', '목', '금', '토'][k.getUTCDay()];
  return `${y}-${m}-${d} (${dow})`;
}

/**
 * 모델에게 기준일 부여
 * 이게 없으면 어제를 계산할 근거가 없음 (recordedAt을 생략하게 됨)
 * 결국 사용자가 보고 있던 날짜에 저장됨
 */
export function buildDateContext(recordedAt?: string): string {
  const now = new Date();
  return [
    `오늘 (KST): ${kstDateLabel(now)}`,
    `사용자가 캘린더에서 보고 있는 날짜: ${kstDateLabel(recordedAt ? new Date(recordedAt) : now)}`,
    '',
    '날짜 규칙:',
    '- 날짜 언급이 없으면 recordedAt 을 생략하세요. 서버가 "보고 있는 날짜" 로 저장합니다.',
    '- "어제 · 그저께 · 지난 화요일" 처럼 상대 표현이 나오면 위 "오늘 (KST)" 를 기준으로',
    '  계산해 recordedAt 을 ISO8601 로 채우세요.',
    '- 시각이 명시되지 않았으면 그 날 12:00 (KST) = 03:00Z 로 잡으세요.',
  ].join('\n');
}

/**
 * 모델에게 주는 "이 날의 기록" - 수정, 삭제할 때 쓸 id와 끼니, 수량, 칼로리
 */
export function buildDayContext(records: DayRecords): string {
  if (records.length === 0) return '이 날의 기록: (아직 없음)';
  const lines = records.map((r) => {
    if (r.type === RecordType.DIET) {
      const meal = r.dietItems.find((d) => d.mealType)?.mealType;
      const mealLabel = meal ? MEAL_LABEL[meal] : '끼니 미지정';
      const items = r.dietItems
        .map((d) => {
          const amount = d.quantity != null && d.unit ? ` ${d.quantity}${d.unit}` : '';
          const kcal = d.calories != null ? ` ${d.calories}kcal` : '';
          return `${d.name}${amount}${kcal}`;
        })
        .join(', ');
      return `- id=${r.id} | 식단 | ${mealLabel} | ${items || '항목 없음'}`;
    }
    const items = r.exerciseItems
      .map((e) => `${e.name}${e.durationMinutes != null ? ` ${e.durationMinutes}분` : ''}`)
      .join(', ');
    return `- id=${r.id} | 운동 | ${items || '항목 없음'}`;
  });
  return ['이 날의 기록 (수정/삭제 시 아래 id 사용):', ...lines].join('\n');
}
