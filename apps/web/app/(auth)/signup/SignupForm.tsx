'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signup, ApiError } from '@/lib/client/auth-api';
import { useAuthStore } from '@/lib/store/auth-store';
import { signupSchema, type SignupValues } from '@/lib/schemas/auth';
import { GoogleButton } from '@/components/auth/GoogleButton';
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
} as const;

export function SignupForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setServerError('');
    try {
      const { user } = await signup({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
      });
      setUser(user);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '회원가입에 실패했습니다.');
    }
  }

  return (
    <Card>
      <h1 className="sr-only">회원가입</h1>
      <div className={STYLES.header}>
        <Image src="/Symbol.svg" alt="FitFoYo" width={48} height={48} priority />
      </div>
      <p className={STYLES.subtitle}>건강 기록을 시작해보세요!</p>
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="passwordConfirm"
          type="password"
          label="비밀번호 확인"
          autoComplete="new-password"
          error={errors.passwordConfirm?.message}
          {...register('passwordConfirm')}
        />
        <Input
          id="nickname"
          label="닉네임"
          autoComplete="nickname"
          error={errors.nickname?.message}
          {...register('nickname')}
        />{' '}
        <div className="flex items-start gap-2">
          <input
            id="agree"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
            {...register('agree')}
          />
          <label htmlFor="agree" className="text-xs leading-relaxed text-muted">
            <Link href="/terms" target="_blank" className={STYLES.link}>
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" target="_blank" className={STYLES.link}>
              개인정보처리방침
            </Link>
            에 동의합니다. <span className="text-danger">(필수)</span>
          </label>
        </div>
        {errors.agree && <p className="text-xs text-danger">{errors.agree.message}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '가입 중…' : '회원가입'}
        </Button>
      </form>

      <div className={STYLES.divider}>
        <span className={STYLES.dividerLine} />
        <span className={STYLES.dividerText}>또는</span>
        <span className={STYLES.dividerLine} />
      </div>

      <GoogleButton label="Google로 시작하기" />
      <p className={STYLES.footer}>
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className={STYLES.link}>
          로그인
        </Link>
      </p>
    </Card>
  );
}
