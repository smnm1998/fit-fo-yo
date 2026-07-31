import { request } from '@/lib/client/auth-api';
import type { RecordDto } from '@/lib/types';

export { ApiError } from '@/lib/client/auth-api';

export type CreateRecordInput = {
  type: 'DIET' | 'EXERCISE';
  recordedAt: string;
  rawInput?: string;
  dietItems?: {
    name: string;
    mealType?: string;
    quantity?: number;
    unit?: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    estimated?: boolean;
  }[];
  exerciseItems?: {
    name: string;
    durationMinutes?: number;
    caloriesBurned?: number;
    intensity?: string;
    estimated?: boolean;
  }[];
};

export type UpdateRecordInput = {
  recordedAt?: string;
  dietItems?: CreateRecordInput['dietItems'];
  exerciseItems?: CreateRecordInput['exerciseItems'];
};

export function parseAndSave(rawInput: string, recordedAt?: string): Promise<RecordDto> {
  return request<RecordDto>('/api/ai/parse-and-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawInput, ...(recordedAt ? { recordedAt } : {}) }),
  });
}

export async function fetchRecords(from: string, to: string, limit = 200): Promise<RecordDto[]> {
  const qs = new URLSearchParams({ from, to, limit: String(limit) });
  const data = await request<{ items: RecordDto[] }>(`/api/records?${qs.toString()}`);
  return data.items;
}

export function deleteRecord(id: string): Promise<void> {
  return request<void>(`/api/records/${id}`, { method: 'DELETE' });
}

export function createRecord(input: CreateRecordInput): Promise<RecordDto> {
  return request<RecordDto>('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateRecord(id: string, input: UpdateRecordInput): Promise<RecordDto> {
  return request<RecordDto>(`/api/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
