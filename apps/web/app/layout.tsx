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
  title: 'FitFoYo',
  description: 'AI 기반 식단/운동 기록 및 일일 추천 캘린더',
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
