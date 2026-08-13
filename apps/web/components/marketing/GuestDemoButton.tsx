'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useChatStore } from '@/lib/store/chat-store';

export function GuestDemoButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (!res.ok) throw new Error('guest issue failed');
      useChatStore.getState().reset();
      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={start} disabled={loading} className={className}>
      {loading ? '준비 중…' : children}
    </button>
  );
}
