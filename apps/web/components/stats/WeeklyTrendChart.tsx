'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayPoint } from '@/lib/records';

const COLORS = { intake: '#10b981', burned: '#0ea5e9', axis: '#737373', grid: '#f3f3f3' };
const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: COLORS.axis },
} as const;

function tickDate(d: string): string {
  const [, m, day] = d.split('-');
  return `${Number(m)}/${Number(day)}`;
}

export function WeeklyTrendChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="date" tickFormatter={(v) => tickDate(String(v))} {...AXIS} />
        <YAxis width={40} {...AXIS} />
        <Tooltip
          labelFormatter={(label) => tickDate(String(label))}
          formatter={(value) => `${value} kcal`}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }}
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="calories"
          name="섭취"
          stroke={COLORS.intake}
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="caloriesBurned"
          name="소모"
          stroke={COLORS.burned}
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
