import { request } from '@/lib/client/auth-api';
import { RecordDto } from '../types';

export { ApiError } from '@/lib/client/auth-api';

export function parseAndSave(rawInput: string, recordedAt?: string): Promise<RecordDto> {
  return request<RecordDto>('/api/ai/parse-and-saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawInput, ...(recordedAt ? { recordedAt } : {}) }),
  });
}
