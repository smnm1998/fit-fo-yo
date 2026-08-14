import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침' };

const STYLES = {
  title: 'text-2xl font-bold text-foreground',
  updated: 'mt-1 text-sm text-muted',
  intro: 'mt-4 text-sm leading-relaxed text-muted',
  section: 'mt-7',
  h2: 'text-base font-semibold text-foreground',
  p: 'mt-2 text-sm leading-relaxed text-muted',
  ul: 'mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted',
} as const;

export default function PrivacyPage() {
  return (
    <article>
      <h1 className={STYLES.title}>개인정보처리방침</h1>
      <p className={STYLES.updated}>시행일: 2026년 8월 14일</p>
      <p className={STYLES.intro}>
        FitFoYo(이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를 아래와 같이 처리합니다. 본 서비스는
        개인 포트폴리오 목적으로 운영됩니다.
      </p>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>1. 수집하는 개인정보 항목</h2>
        <ul className={STYLES.ul}>
          <li>
            계정: 이메일, 비밀번호(암호화 저장), 닉네임 (Google 로그인 시 Google 계정 식별자·이메일)
          </li>
          <li>
            건강 정보(선택): 키, 몸무게, 기저질환 등. <strong>민감정보</strong>이며 입력은 이용자의
            선택입니다.
          </li>
          <li>기록: 이용자가 입력한 식단·운동 원문 텍스트와 AI 분석 결과(칼로리 등)</li>
        </ul>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>2. 이용 목적</h2>
        <p className={STYLES.p}>
          식단·운동 기록의 저장·조회, AI 분석 및 하루 단위 추천 제공, 계정 인증.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>3. 제3자 처리 위탁</h2>
        <p className={STYLES.p}>
          AI 분석을 위해 이용자가 입력한 텍스트와 건강 정보 일부가 OpenAI, L.L.C.로 전송·처리됩니다.
          민감한 개인정보는 입력하지 않도록 유의해 주세요.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>4. 보유 및 이용 기간</h2>
        <ul className={STYLES.ul}>
          <li>
            회원 데이터: 서비스 이용 기간 동안 보관하며, 계정 삭제 요청 시 지체 없이 파기합니다.
          </li>
          <li>게스트 데이터: 생성 후 24시간이 지나면 자동으로 영구 삭제됩니다.</li>
        </ul>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>5. 이용자의 권리 및 인증 쿠키</h2>
        <p className={STYLES.p}>
          이용자는 본인의 기록을 조회·수정·삭제할 수 있으며 계정 삭제를 요청할 수 있습니다. 로그인
          유지를 위해 HttpOnly 인증 쿠키를 사용하며, 광고·추적 목적 쿠키는 사용하지 않습니다.
        </p>
      </section>

      <section className={STYLES.section}>
        <h2 className={STYLES.h2}>6. 문의</h2>
        <p className={STYLES.p}>개인정보 관련 문의: {'{{smnm9812@gmail.com}}'}</p>
      </section>
    </article>
  );
}
