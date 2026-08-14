import type { Metadata } from 'next';

export const metadata: Metadata = { title: '이용약관' };

const STYLES = {
  title: 'text-2xl font-bold text-foreground',
  updated: 'mt-1 text-sm text-muted',
  section: 'mt-7',
  h2: 'text-base font-semibold text-foreground',
  p: 'mt-2 text-sm leading-relaxed text-muted',
  ul: 'mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted',
} as const;

export default function TermsPage() {
  return (
    <article>
      <h1 className={STYLES.title}>이용약관</h1>
      <p className={STYLES.updated}>시행일: 2026년 8월 14일</p>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제1조 (목적)</h2>
        <p className={STYLES.p}>
          이 약관은 FitFoYo(이하 &ldquo;서비스&rdquo;)가 제공하는 AI 기반 식단·운동 기록 및 추천
          서비스의 이용 조건을 정합니다. 본 서비스는 개인 포트폴리오 목적으로 운영되며 상업적
          서비스가 아닙니다.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제2조 (서비스 내용)</h2>
        <p className={STYLES.p}>
          이용자가 입력한 식단·운동 내용을 AI로 분석해 칼로리 등으로 정리하고, 하루 단위 기록과
          참고용 추천을 제공합니다.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제3조 (계정과 게스트)</h2>
        <ul className={STYLES.ul}>
          <li>이메일 또는 Google 계정으로 가입하며, 계정 관리 책임은 이용자에게 있습니다.</li>
          <li>게스트 모드로 생성된 데이터는 24시간이 지나면 자동으로 삭제됩니다.</li>
        </ul>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제4조 (AI 추천의 한계)</h2>
        <p className={STYLES.p}>
          서비스가 제공하는 칼로리 추정과 식단·운동 추천은 <strong>참고용 정보</strong>이며,
          의학적·영양학적 진단이나 처방이 아닙니다. 건강에 관한 결정은 전문가와 상담하시기 바랍니다.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제5조 (금지 행위 및 면책)</h2>
        <p className={STYLES.p}>
          타인의 정보 도용, 서비스 운영 방해, 자동화된 대량 요청을 금지합니다. 본 서비스는 무상으로
          제공되며 데이터의 정확성이나 연속성을 보장하지 않고, 이용으로 발생한 손해에 책임지지
          않습니다.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>제6조 (준거법 및 문의)</h2>
        <p className={STYLES.p}>
          본 약관은 대한민국 법률에 따릅니다. 문의: {'{{smnm9812@gmail.com}}'}
        </p>
      </section>
    </article>
  );
}
