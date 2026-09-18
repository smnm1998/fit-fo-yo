'use client';

import { useRouter } from 'next/navigation';
import { ChatView } from '@/components/dashboard/day-panel/chat/ChatView';

export function ChatScreen({
  recordedAt,
  dateLabelText,
}: {
  recordedAt: string;
  dateLabelText: string;
}) {
  const router = useRouter();

  return (
    <ChatView
      recordedAt={recordedAt}
      dateLabelText={dateLabelText}
      onBack={() => router.push('/dashboard')}
    />
  );
}
