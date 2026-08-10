import { request } from '@/lib/client/auth-api';
import type { RecordDto, RecommendationDto } from './../types';

export type MonthData = { records: RecordDto[]; recommendations: RecommendationDto[] };

export function fetchMonthData(month: string): Promise<MonthData> {
  return request<MonthData>(`/api/month?month=${month}`);
}
