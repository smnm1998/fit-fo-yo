import type { Metadata } from 'next';
import { dateLabelDow, dayNoonIsoKST, todayKST } from '@/lib/date';
import { ChatScreen } from './ChatScreen';

export const metadata: Metadata = { title: 'AI 기록' };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2$/.test(sp.date) ? sp.date : todayKST();

  return <ChatScreen recordedAt={dayNoonIsoKST(date)} dateLabelText={dateLabelDow(date)} />;
}
