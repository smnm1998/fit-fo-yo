import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: '회원가입 · FitFoYo',
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
