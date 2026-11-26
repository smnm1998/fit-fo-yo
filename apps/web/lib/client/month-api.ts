import type { z } from 'zod';
import { request } from '@/lib/client/auth-api';
import { MonthDataSchema } from '@/lib/schemas/api';

export type MonthData = z.infer<typeof MonthDataSchema>;

export function fetchMonthData(month: string): Promise<MonthData> {
  return request(`/api/month?month=${month}`, MonthDataSchema);
}
