'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { dayKeyKST } from '@/lib/date';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { COMPACT_QUERY } from '@/lib/media';
import type { DayTotals } from '@/lib/records';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { DashboardView } from './DashboardView';
import { ChatView } from './chat/ChatView';

type Props = {
  dateLabelText: string;
  isToday: boolean;
  recordedAt: string;
  totals: DayTotals;
  dayRec: RecommendationDto | null;
  dayRecords: RecordDto[];
  onLeave?: () => void;
};

export function DayPanel({ onLeave, ...props }: Props) {
  const [mode, setMode] = useState<'dashboard' | 'input'>('dashboard');
  const router = useRouter();
  const isCompact = useMediaQuery(COMPACT_QUERY);

  if (mode === 'input') {
    return <ChatView recordedAt={props.recordedAt} onBack={() => setMode('dashboard')} />;
  }

  function openChat() {
    if (isCompact) {
      onLeave?.();
      router.push(`/chat?date=${dayKeyKST(props.recordedAt)}`);
      return;
    }
    setMode('input');
  }

  return <DashboardView {...props} onOpenChat={openChat} />;
}
