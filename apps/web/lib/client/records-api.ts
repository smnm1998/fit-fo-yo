import { request } from '@/lib/client/auth-api';
import {
  AiChatResponseSchema,
  NoContentSchema,
  RecordListSchema,
  RecordPageSchema,
  RecordSchema,
} from '@/lib/schemas/api';
import type { RecordDto, AiChatTurn, AiChatResponse } from '@/lib/types';

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
    grams?: number;
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

export function aiChat(messages: AiChatTurn[], recordedAt?: string): Promise<AiChatResponse> {
  return request('/api/ai/chat', AiChatResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, ...(recordedAt ? { recordedAt } : {}) }),
  });
}

export type UpdateRecordInput = {
  recordedAt?: string;
  dietItems?: CreateRecordInput['dietItems'];
  exerciseItems?: CreateRecordInput['exerciseItems'];
};

export function parseAndSave(rawInput: string, recordedAt?: string): Promise<RecordDto[]> {
  return request('/api/ai/parse-and-save', RecordListSchema, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawInput, ...(recordedAt ? { recordedAt } : {}) }),
  });
}

export async function fetchRecords(from: string, to: string, limit = 200): Promise<RecordDto[]> {
  const qs = new URLSearchParams({ from, to, limit: String(limit) });
  const data = await request(`/api/records?${qs.toString()}`, RecordPageSchema);
  return data.items;
}

export async function deleteRecord(id: string): Promise<void> {
  await request(`/api/records/${id}`, NoContentSchema, { method: 'DELETE' });
}

export function createRecord(input: CreateRecordInput): Promise<RecordDto> {
  return request('/api/records', RecordSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateRecord(id: string, input: UpdateRecordInput): Promise<RecordDto> {
  return request(`/api/records/${id}`, RecordSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
