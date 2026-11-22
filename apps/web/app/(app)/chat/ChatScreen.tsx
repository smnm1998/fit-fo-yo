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
      className="h-[calc(100dvh-56px)] rounded-none border-0 md:h-dvh wide:h-[calc(100dvh-11rem)] wide:rounded-2xl wide:border"
    />
  );
}
