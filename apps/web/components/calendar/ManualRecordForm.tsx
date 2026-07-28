'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createRecord, ApiError, type CreateRecordInput } from '@/lib/client/records-api';
import { useRecordsStore } from '@/lib/store/records-store';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  type: z.enum(['DIET', 'EXERCISE']),
  name: z.string().trim().min(1, '이름을 입력해주세요').max(100),
  mealType: z.string().optional(),
  calories: z.string().optional(),
  durationMinutes: z.string().optional(),
  caloriesBurned: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type RecordType = FormValues['type'];

const TYPE_META: Record<RecordType, { label: string; dot: string }> = {
  DIET: { label: '식단', dot: 'bg-emerald-500' },
  EXERCISE: { label: '운동', dot: 'bg-sky-500' },
};
const TYPE_ORDER: RecordType[] = ['DIET', 'EXERCISE'];

const MEALS = [
  { value: '', label: '식사 선택' },
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
];

const STYLES = {
  form: 'flex flex-col gap-3',
  header: 'flex items-center justify-between gap-2',
  footer: 'flex justify-end pt-1',

  date: 'text-sm font-semibold text-foreground',
  ddWrap: 'relative',
  ddBtn:
    'flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-sm text-foreground transition-colors hover:bg-subtle',
  ddMenu:
    'absolute right-0 top-full z-10 mt-1 flex w-28 flex-col rounded-lg border border-border bg-surface p-1 shadow-md',
  ddItem:
    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-subtle',
  dot: 'h-2.5 w-2.5 rounded-full',
  fields: 'flex flex-col',
  field: 'flex items-center gap-3 border-b border-border py-2',
  label: 'w-16 shrink-0 text-xs text-muted',
  input: 'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted',
  err: 'text-xs text-danger',
} as const;

const toNum = (s?: string) => (s && s.trim() !== '' ? Number(s) : undefined);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={STYLES.field}>
      <span className={STYLES.label}>{label}</span>
      {children}
    </div>
  );
}

function TypeSelect({ value, onChange }: { value: RecordType; onChange: (t: RecordType) => void }) {
  const [open, setOpen] = useState(false);
  const current = TYPE_META[value];
  return (
    <div className={STYLES.ddWrap}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={STYLES.ddBtn}>
        <span className={cn(STYLES.dot, current.dot)} />
        {current.label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className={STYLES.ddMenu}>
          {TYPE_ORDER.map((t) => {
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={STYLES.ddItem}
              >
                <span className={cn(STYLES.dot, meta.dot)} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ManualRecordForm({
  recordedAt,
  dateText,
}: {
  recordedAt: string;
  dateText: string;
}) {
  const addRecord = useRecordsStore((s) => s.addRecord);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'DIET',
      name: '',
      mealType: '',
      calories: '',
      durationMinutes: '',
      caloriesBurned: '',
    },
  });
  const type = watch('type');

  async function onSubmit(v: FormValues) {
    setServerError(null);
    const input: CreateRecordInput =
      v.type === 'DIET'
        ? {
            type: 'DIET',
            recordedAt,
            dietItems: [
              { name: v.name, mealType: v.mealType || undefined, calories: toNum(v.calories) },
            ],
          }
        : {
            type: 'EXERCISE',
            recordedAt,
            exerciseItems: [
              {
                name: v.name,
                durationMinutes: toNum(v.durationMinutes),
                caloriesBurned: toNum(v.caloriesBurned),
              },
            ],
          };
    try {
      const record = await createRecord(input);
      addRecord(record);
      reset({
        type: v.type,
        name: '',
        mealType: '',
        calories: '',
        durationMinutes: '',
        caloriesBurned: '',
      });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '저장에 실패했어요.');
    }
  }

  return (
    <form className={STYLES.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={STYLES.header}>
        <span className={STYLES.date}>{dateText}</span>
        <TypeSelect value={type} onChange={(t) => setValue('type', t)} />
      </div>

      <div className={STYLES.fields}>
        <Field label={type === 'DIET' ? '음식 종류' : '운동 이름'}>
          <input
            className={STYLES.input}
            placeholder={type === 'DIET' ? '비빔밥' : '러닝'}
            {...register('name')}
          />
        </Field>
        {type === 'DIET' ? (
          <>
            <Field label="식사 시간">
              <select className={STYLES.input} {...register('mealType')}>
                {MEALS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="칼로리">
              <input
                type="number"
                min={0}
                className={STYLES.input}
                placeholder="kcal"
                {...register('calories')}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="시간(분)">
              <input
                type="number"
                min={0}
                className={STYLES.input}
                placeholder="분"
                {...register('durationMinutes')}
              />
            </Field>
            <Field label="소모">
              <input
                type="number"
                min={0}
                className={STYLES.input}
                placeholder="kcal"
                {...register('caloriesBurned')}
              />
            </Field>
          </>
        )}
      </div>

      {errors.name && <p className={STYLES.err}>{errors.name.message}</p>}
      {serverError && <p className={STYLES.err}>{serverError}</p>}

      <div className={STYLES.footer}>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? '저장 중…' : '등록하기'}
        </Button>
      </div>
    </form>
  );
}
