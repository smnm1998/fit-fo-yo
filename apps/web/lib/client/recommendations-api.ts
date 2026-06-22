import { request } from '@/lib/client/auth-api';
import { RecommendationDto } from '@/lib/types';

export function fetchRecommendations(from: string, to: string): Promise<RecommendationDto[]> {
  const qs = new URLSearchParams({ from, to });
  return request<RecommendationDto[]>(`/api/recommendations?${qs.toString()}`);
}

export { ApiError } from '@/lib/client/auth-api';

export function generateRecommendation(): Promise<RecommendationDto | null> {
  return request<RecommendationDto | null>('/api/recommendations/generate', { method: 'POST' });
}
