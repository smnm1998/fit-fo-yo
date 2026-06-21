import { endOfDay, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Seoul';

export function todayRangeKST(): { from: string; to: string } {
  const zonedNow = toZonedTime(new Date(), TZ);
  const from = fromZonedTime(startOfDay(zonedNow), TZ).toISOString();
  const to = fromZonedTime(endOfDay(zonedNow), TZ).toISOString();
  return { from, to };
}
