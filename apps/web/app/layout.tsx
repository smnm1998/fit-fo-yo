import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';

const pretendard = localFont({
  src: './fonts/IBMPlexSansKR-Medium.woff2',
  variable: '--font-sans-kr',
  display: 'swap',
  weight: '45 920',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'FitFoYo · AI 식단·운동 기록 캘린더',
    template: '%s · FitFoYo',
  },
  description:
    '먹은 것과 운동을 말하듯 적으면 AI가 알아서 칼로리로 정리하고, 하루 단위로 맞춤 조언을 주는 건강 기록 캘린더.',
  applicationName: 'FitFoYo',
  keywords: [
    '식단 기록',
    '운동 기록',
    '칼로리 계산',
    'AI 건강관리',
    '다이어트 캘린더',
    '식단 관리',
  ],
  authors: [{ name: 'FitFoYo' }],
  category: 'health',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'FitFoYo',
    title: 'FitFoYo · AI 식단·운동 기록 캘린더',
    description:
      '말하듯 적으면 AI가 칼로리로 정리하고, 하루 단위로 맞춤 조언을 주는 건강 기록 캘린더.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitFoYo · AI 식단·운동 기록 캘린더',
    description: '말하듯 적으면 AI가 칼로리로 정리해 주는 건강 기록 캘린더.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={pretendard.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
