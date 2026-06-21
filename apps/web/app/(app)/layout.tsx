import { redirect } from 'next/navigation';
import { apiFetchAuth } from '@/lib/server/api';
import { AppShell } from '@/components/layout/AppShell';
import type { ApiUser } from '@/lib/types';

async function getUser(): Promise<ApiUser> {
  const res = await apiFetchAuth('/auth/me');
  if (!res.ok) redirect('/login');
  const data = (await res.json()) as { user: ApiUser };
  return data.user;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return <AppShell user={user}>{children}</AppShell>;
}
