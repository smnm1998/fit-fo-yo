import { request } from './auth-api';
import type { HealthProfileDto } from '../types';

export type HealthProfileInput = {
  heightCm?: number;
  weightKg?: number;
  conditions?: string;
};

export function fetchHealthProfile(): Promise<HealthProfileDto | null> {
  return request<HealthProfileDto | null>('/api/health-profile');
}

export function saveHealthProfile(input: HealthProfileInput): Promise<HealthProfileDto> {
  return request<HealthProfileDto>('/api/health-profile', {
    method: 'PUT',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
