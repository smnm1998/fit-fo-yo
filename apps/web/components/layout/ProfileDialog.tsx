'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, X } from 'lucide-react';
import { ApiError } from '@/lib/client/auth-api';
import { fetchHealthProfile, saveHealthProfile } from '@/lib/client/health-profile-api';

const numField = (max: number) =>
  z
    .string()
    .refine(
      (s) => s.trim() === '' || (!Number.isNaN(Number(s)) && Number(s) >= 0 && Number(s) <= max),
      '올바른 값을 입력해주세요',
    );

const schema = z.object({
  heightCm: numField(300),
  weightKg: numField(500),
  conditions: z.string().max(500, '500자 이내로 입력해주세요'),
});
type FormValues = z.infer<typeof schema>;

const STYLES = {
  overlay: 'fixed inset-0 z-40 bg-black/30',
  content:
    'fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=open]:animate-[popIn_140ms_ease-out]',
  panel:
    'flex w-[min(420px,100%)] flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xl',
  head: 'flex items-center justify-between',
  title: 'flex items-center gap-2 text-base font-bold text-foreground',
  close: 'rounded-lg p-1 text-muted transition-colors hover:bg-subtle hover:text-foreground',
  desc: 'text-xs text-muted',
  form: 'flex flex-col gap-1',
  field: 'flex items-center gap-3 border-b border-border py-2.5',
  label: 'w-24 shrink-0 text-sm text-muted',
  input: 'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted',
  block: 'flex flex-col gap-1 border-b border-border py-2.5',
  blockLabel: 'text-sm text-muted',
  textarea:
    'min-h-[64px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted',
  err: 'text-xs text-danger',
  footer: 'mt-2 flex justify-end',
  save: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-40',
  loading: 'py-10 text-center text-sm text-muted',
} as const;

const toNum = (s: string) => (s.trim() !== '' ? Number(s) : undefined);

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { heightCm: '', weightKg: '', conditions: '' },
  });

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setServerError(null);
    setLoading(true);
    fetchHealthProfile()
      .then((p) => {
        if (!alive) return;
        reset({
          heightCm: p?.heightCm != null ? String(p.heightCm) : '',
          weightKg: p?.weightKg != null ? String(p.weightKg) : '',
          conditions: p?.conditions ?? '',
        });
      })
      .catch(() => {
        // 조회 실패해도 빈 폼으로 진행
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, reset]);

  async function onSubmit(v: FormValues) {
    setServerError(null);
    try {
      await saveHealthProfile({
        heightCm: toNum(v.heightCm),
        weightKg: toNum(v.weightKg),
        conditions: v.conditions.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '저장에 실패했어요.');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={STYLES.overlay} />
        <Dialog.Content className={STYLES.content}>
          <div className={STYLES.panel}>
            <div className={STYLES.head}>
              <Dialog.Title className={STYLES.title}>
                <User size={18} /> 내 정보
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="닫기" className={STYLES.close}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className={STYLES.desc}>
              키·몸무게·고질병은 AI 추천을 개인화하는 데 쓰여요. 모두 선택 입력입니다.
            </Dialog.Description>

            {loading ? (
              <p className={STYLES.loading}>불러오는 중…</p>
            ) : (
              <form className={STYLES.form} onSubmit={handleSubmit(onSubmit)}>
                <div className={STYLES.field}>
                  <span className={STYLES.label}>키 (cm)</span>
                  <input
                    type="number"
                    min={0}
                    className={STYLES.input}
                    placeholder="170"
                    {...register('heightCm')}
                  />
                </div>
                <div className={STYLES.field}>
                  <span className={STYLES.label}>몸무게 (kg)</span>
                  <input
                    type="number"
                    min={0}
                    className={STYLES.input}
                    placeholder="65"
                    {...register('weightKg')}
                  />
                </div>
                <div className={STYLES.block}>
                  <span className={STYLES.blockLabel}>고질병 · 주의사항</span>
                  <textarea
                    className={STYLES.textarea}
                    placeholder="예: 무릎 부상, 유당불내증 (선택)"
                    {...register('conditions')}
                  />
                </div>

                {(errors.heightCm || errors.weightKg || errors.conditions) && (
                  <p className={STYLES.err}>
                    {errors.heightCm?.message ??
                      errors.weightKg?.message ??
                      errors.conditions?.message}
                  </p>
                )}
                {serverError && <p className={STYLES.err}>{serverError}</p>}

                <div className={STYLES.footer}>
                  <button type="submit" disabled={isSubmitting} className={STYLES.save}>
                    {isSubmitting ? '저장 중…' : '저장'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
