import { proxyAuth } from '@/lib/server/api';

export function GET() {
  return proxyAuth('/auth/me');
}
