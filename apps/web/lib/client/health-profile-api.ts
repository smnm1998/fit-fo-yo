import { request } from './auth-api';
import { HealthProfileSchema } from '@/lib/schemas/api';
import type { HealthProfileDto } from '@/lib/types';

export type HealthProfileInput = {
  heightCm?: number;
  weightKg?: number;
  conditions?: string;
};

export function fetchHealthProfile(): Promise<HealthProfileDto | null> {
  return request('/api/health-profile', HealthProfileSchema.nullable());
}

export function saveHealthProfile(input: HealthProfileInput): Promise<HealthProfileDto> {
  return request('/api/health-profile', HealthProfileSchema, {
    method: 'PUT',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
