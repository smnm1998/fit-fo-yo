import { request } from '@/lib/client/auth-api';
import type { RecordDto } from '@/lib/types';

export { ApiError } from '@/lib/client/auth-api';

export function parseAndSave(rawInput: string, recordedAt?: string): Promise<RecordDto> {
  return request<RecordDto>('/api/ai/parse-and-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawInput, ...(recordedAt ? { recordedAt } : {}) }),
  });
}

export async function fetchRecords(from: string, to: string, limit = 200): Promise<RecordDto[]> {
  const qs = new URLSearchParams({ from: to, limit: String(limit) });
  const data = await request<{ items: RecordDto[] }>(`/api/records?${qs.toString()}`);
  return data.items;
}

export function deleteRecord(id: string): Promise<void> {
  return request<void>(`/api/records/${id}`, { method: 'DELETE' });
}
