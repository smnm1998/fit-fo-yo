import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { getCurrentUser } from '@/lib/server/user';
import { TypingTags } from '@/components/marketing/TypingTags';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/marketing/Reveal';
import { GuestDemoButton } from '@/components/marketing/GuestDemoButton';

type Feature = {
  title: string;
  desc: string;
  points: string[];
  src: string;
  alt: string;
};

const FEATURES: Feature[] = [
  {
    title: '먹은 걸 말하듯 적으면 끝',
    desc: '“닭가슴살 200g 먹고 30분 뛰었어”처럼 편하게 적기만 하면, 무엇을 먹고 어떤 운동을 했는지 AI가 알아서 나눠 정리해줘요.',
    points: [
      '먹은 것과 운동을 자동으로 구분',
      '메뉴·양까지 알아서 정리',
      '적은 문장 그대로도 보관',
    ],
    src: '/ai-chat.mp4',
    alt: 'AI에게 자연어로 기록하는 화면',
  },
  {
    title: '칼로리를 대충 세지 않아요',
    desc: '잘 알려진 음식은 실제 영양 정보로 계산하고, 정보가 없는 음식은 “추정값”이라고 솔직하게 표시해요. 그래서 숫자를 믿을 수 있어요.',
    points: [
      '아는 음식은 실제 정보로 계산',
      '모르는 음식은 “추정”으로 표시',
      '터무니없이 큰 숫자는 걸러냄',
    ],
    src: '/calorie.mp4',
    alt: '칼로리와 추정 표시가 보이는 기록 화면',
  },
  {
    title: '하루를 달력에서 한눈에',
    desc: '달력에서 날짜를 누르면 그날 먹은 것과 운동이 한눈에 보여요. 아침·점심·저녁으로 나눠서, 칼로리 합계까지 정리돼요.',
    points: [
      '날짜만 누르면 그날 기록 확인',
      '끼니별 정리 + 칼로리 합계',
      '그 자리에서 고치고 지우기',
    ],
    src: '/calendar.mp4',
    alt: '월간 달력과 하루 기록 화면',
  },
];

const STEPS = [
  { n: '01', title: '말하듯 적기', desc: '“오늘 점심 김치찌개랑 밥”처럼 편하게 적어요.' },
  { n: '02', title: 'AI가 정리', desc: '먹은 것과 운동을 나누고 칼로리를 계산해요.' },
  { n: '03', title: '달력에 쌓기', desc: '기록이 달력에 쌓이고, 맞춤 추천도 받아요.' },
];

function ShotFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5 dark:shadow-black/40">
      <div className="flex items-center gap-1.5 border-b border-border bg-subtle px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
      </div>
      <div className="relative aspect-video bg-subtle">
        <video
          src={src}
          aria-label={alt}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export default async function Home() {
  const jar = await cookies();
  if (jar.get('access_token') || jar.get('refresh_token')) {
    const user = await getCurrentUser();
    if (user) redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/70 backdrop-blur">
        <nav className="mx-auto flex h-[72px] max-w-5xl items-center justify-between gap-4 px-5">
          {/* 좌: 심볼만 */}
          <Link href="/" aria-label="FitFoYo 홈" className="shrink-0">
            <Image
              src="/Symbol.svg"
              alt="FitFoYo"
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10"
            />
          </Link>

          {/* 우: 인증 */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
            >
              시작하기
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero — 뷰포트 꽉 차게(헤더 72px 제외) + 배경 심장박동 글로우 */}
        <section className="relative flex min-h-[calc(100dvh-72px)] flex-col justify-center overflow-hidden px-5 py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="hero-glow h-[clamp(280px,55vw,560px)] w-[clamp(280px,55vw,560px)] rounded-full opacity-50 blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <Reveal>
              <TypingTags />
              <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                말하듯 기록하면,
                <br /> AI가 기록 정리를.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
                식단·운동을 편하게 적어보세요.
                <br />
                AI가 알아서 나누고 칼로리를 계산해 달력에 정리해줘요.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90"
                >
                  무료로 시작하기
                </Link>
                <GuestDemoButton className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-subtle disabled:opacity-60">
                  게스트로 둘러보기
                </GuestDemoButton>
              </div>
              <p className="mt-3 text-xs text-muted">
                가입 없이 체험 · 게스트 데이터는 24시간 후 자동 삭제
              </p>
            </Reveal>
          </div>
        </section>

        {/* Features — surface */}
        <section id="features" className="scroll-mt-24 bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <Reveal>
              <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
                기록은 쉽게, 관리는 똑똑하게
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted">
                복잡한 입력 없이, 한 줄이면 시작돼요.
              </p>
            </Reveal>

            <div className="mt-14 flex flex-col gap-16 sm:gap-24">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title}>
                  <div className="grid items-center gap-8 md:grid-cols-2">
                    <div className={i % 2 ? 'md:order-2' : ''}>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {f.title}
                      </h3>
                      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">
                        {f.desc}
                      </p>
                      <ul className="mt-5 space-y-2">
                        {f.points.map((p) => (
                          <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={i % 2 ? 'md:order-1' : ''}>
                      <ShotFrame src={f.src} alt={f.alt} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — subtle */}
        <section id="how" className="scroll-mt-24 bg-subtle">
          <div className="mx-auto max-w-5xl px-5 py-24 sm:py-28">
            <Reveal>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                3단계면 충분합니다
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-12 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 100}>
                  <div>
                    <span className="font-mono text-4xl font-bold text-emerald-500/90 sm:text-5xl">
                      {s.n}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-foreground">
                      <span className="title-mark">{s.title}</span>
                    </h3>{' '}
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — 담백 미니멀 중앙 */}
        <section className="px-5 py-28 text-center sm:py-32">
          <Reveal>
            <div className="mx-auto max-w-xl">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                오늘 먹은 것부터 기록해보세요
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                복잡한 설정 없이, 오늘 먹은 것 한 줄이면 시작이에요.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  무료로 시작하기
                </Link>
                <GuestDemoButton className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-subtle disabled:opacity-60">
                  게스트로 둘러보기
                </GuestDemoButton>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row">
          <span>© 2026 FitFoYo</span>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-foreground">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
