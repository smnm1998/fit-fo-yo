import type { Metadata } from 'next';
import { dateLabelDow, dayNoonIsoKST, isDayKey, todayKST } from '@/lib/date';
import { ChatScreen } from './ChatScreen';

export const metadata: Metadata = { title: 'AI 기록' };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = isDayKey(sp.date) ? sp.date : todayKST();

  return <ChatScreen recordedAt={dayNoonIsoKST(date)} dateLabelText={dateLabelDow(date)} />;
}
