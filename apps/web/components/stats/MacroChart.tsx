'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const MACROS = [
  { name: '탄수화물', dataKey: 'carbs', color: '#0ea5e9' },
  { name: '단백질', dataKey: 'protein', color: '#10b981' },
  { name: '지방', dataKey: 'fat', color: '#f59e0b' },
] as const;

export function MacroChart({
  carbs,
  protein,
  fat,
}: {
  carbs: number;
  protein: number;
  fat: number;
}) {
  const values = { carbs, protein, fat };
  const data = MACROS.map((m) => ({ name: m.name, value: values[m.dataKey], color: m.color }));
  const total = carbs + protein + fat;

  if (total === 0) {
    return <p className="py-12 text-center text-sm text-muted">아직 영양 데이터가 없어요.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          dataKey="value"
          data={data}
          nameKey="name"
          innerRadius={56}
          outerRadius={84}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value} g`}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--foreground)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }} />

        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
