import z from 'zod';

export const loginSchema = z.object({
  email: z.email('유효한 이메일을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.email('유효한 이메일을 입력하세요.').max(100, '이메일은 100자 이하여야 합니다.'),
    password: z
      .string()
      .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,30}$/, '영문과 숫자를 포함해 8–30자로 입력하세요.'),
    passwordConfirm: z.string(),
    nickname: z
      .string()
      .min(2, '닉네임은 2~10자로 입력하세요.')
      .max(10, '닉네임은 2~10자로 입력하세요.'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type SignupValues = z.infer<typeof signupSchema>;
