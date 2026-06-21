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

export function deleteRecord(id: string): Promise<void> {
  return request<void>(`/api/records/${id}`, { method: 'DELETE' });
}
