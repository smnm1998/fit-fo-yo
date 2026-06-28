'use client';

import { useState } from 'react';
import type { DayTotals } from '@/lib/records';
import type { RecommendationDto, RecordDto } from '@/lib/types';
import { DashboardView } from './DashboardView';
import { ChatView } from './ChatView';

type Props = {
  dateLabelText: string;
  isToday: boolean;
  recordedAt: string;
  totals: DayTotals;
  dayRec: RecommendationDto | null;
  dayRecords: RecordDto[];
};

export function DayPanel({
  dateLabelText,
  isToday,
  recordedAt,
  totals,
  dayRec,
  dayRecords,
}: Props) {
  const [mode, setMode] = useState<'dashboard' | 'input'>('dashboard');

  if (mode === 'input') {
    return (
      <ChatView
        dateLabelText={dateLabelText}
        recordedAt={recordedAt}
        onBack={() => setMode('dashboard')}
      />
    );
  }

  return (
    <DashboardView
      dateLabelText={dateLabelText}
      isToday={isToday}
      recordedAt={recordedAt}
      totals={totals}
      dayRec={dayRec}
      dayRecords={dayRecords}
      onOpenChat={() => setMode('input')}
    />
  );
}
