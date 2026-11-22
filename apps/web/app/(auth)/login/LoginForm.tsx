'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { login, ApiError } from '@/lib/client/auth-api';
import { useAuthStore } from '@/lib/store/auth-store';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { GuestDemoButton } from '@/components/marketing/GuestDemoButton';
import Image from 'next/image';

const STYLES = {
  header: 'mb-2 flex justify-center',
  subtitle: 'mb-4 text-center text-sm text-muted',
  form: 'flex flex-col gap-4',
  error: 'rounded-lg bg-subtle px-3 py-2 text-sm whitespace-pre-line text-danger',
  divider: 'my-5 flex items-center gap-3',
  dividerLine: 'h-px flex-1 bg-border',
  dividerText: 'text-xs text-muted',
  footer: 'mt-6 text-center text-sm text-muted',
  link: 'font-semibold text-accent underline-offset-2 hover:underline',
  guestBox:
    'mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-subtle px-4 py-3.5',
  guestTitle: 'block text-[13.5px] font-bold text-foreground',
  guestText: 'text-[12.5px] leading-snug text-muted',
  guestBtn:
    'shrink-0 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-[12.5px] font-bold text-foreground transition-colors hover:border-muted disabled:opacity-60',
} as const;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError('');
    try {
      const { user } = await login(values.email, values.password);
      setUser(user);
      router.replace(params.get('redirect') ?? '/dashboard');
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.');
    }
  }

  return (
    <>
      <Card>
        <h1 className="sr-only">로그인</h1>
        <div className={STYLES.header}>
          <Image src="/Symbol.svg" alt="FitFoYo" width={48} height={48} priority />
        </div>
        <p className={STYLES.subtitle}>오늘도 건강한 하루되세요! </p>
        <form className={STYLES.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && <p className={STYLES.error}>{serverError}</p>}
          <Input
            id="email"
            type="email"
            label="이메일"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            id="password"
            type="password"
            label="비밀번호"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <div className={STYLES.divider}>
          <span className={STYLES.dividerLine} />
          <span className={STYLES.dividerText}>또는</span>
          <span className={STYLES.dividerLine} />
        </div>

        <GoogleButton label="Google로 로그인" />

        <p className={STYLES.footer}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className={STYLES.link}>
            회원가입
          </Link>
        </p>
      </Card>

      <div className={STYLES.guestBox}>
        <p className={STYLES.guestText}>
          <b className={STYLES.guestTitle}>먼저 둘러볼까요?</b>
          가입 없이 최대 5분 동안 체험하실 수 있습니다!
        </p>
        <GuestDemoButton className={STYLES.guestBtn}>둘러보기</GuestDemoButton>
      </div>
    </>
  );
}
