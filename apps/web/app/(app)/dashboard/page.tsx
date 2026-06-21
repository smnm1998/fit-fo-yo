import type { Metadata } from 'next';
import { RecordInput } from '@/components/records/RecordInput';
import { RecordList } from '@/components/records/RecordList';

export const metadata: Metadata = { title: '오늘 · FitFoYo' };

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="mb-3 text-xl font-semibold text-foreground">오늘의 기록</h1>
        <RecordInput />
      </div>
      <RecordList />
    </section>
  );
}
