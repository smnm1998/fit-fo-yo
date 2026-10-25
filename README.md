<div align="center">

<img src="apps/web/public/Symbol.svg" width="120" alt="FitFoYo" />

# FitFoYo

### AI가 대신 정리하는 식단·운동 기록 캘린더

먹은 것·운동을 <b>말하듯 한 줄</b> 적으면,<br/>
AI가 알아서 칼로리로 정리하고 하루 단위로 조언을 줍니다.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)

</div>

<br/>

## 📖 프로젝트 소개

식단·운동을 자연어로 입력하면 **AI(OpenAI)** 가 항목을 분류·정산해 기록하고, 달력에서 하루를 한눈에 보여주는 헬스케어 캘린더입니다.

"오늘 뭘 먹었는지 일일이 검색하고 계산하는" 번거로움을 없애는 게 목표였고, **AI 출력을 그대로 믿지 않고 식약처 공공 영양성분 데이터로 다시 계산**하는 신뢰성에 특히 집중했습니다. 기획부터 설계·개발·배포·운영까지 **단독으로** 진행한 개인 프로젝트입니다.

<br/>

## 🌟 핵심 기능

- **🗣️ 대화형 AI 기록** — "닭가슴살 200g 먹고 30분 뛰었어" → 식단·운동을 각각 구분해 기록. 수정·삭제도 대화로.
- **🎯 믿을 수 있는 칼로리** — 식약처 데이터에 있는 음식은 공식 값으로 계산, 없는 음식은 "추정"으로 표시하고 같은 음식은 늘 같은 값으로 기록.
- **🗓️ 하루 단위 캘린더** — 날짜별 끼니 정리·칼로리 합계·맞춤 추천을 한 화면에서.
- **👤 게스트 체험** — 가입 없이 5분 동안 체험(AI 10회), 게스트 데이터는 24시간이 지나면 자동 삭제.

<br/>

## 🏗️ 시스템 아키텍처

TurboRepo 모노레포 · **BFF 패턴** — 프론트엔드는 DB에 직접 접근하지 않습니다. BFF 계층이 데이터를 정제(집계·DTO 변환)하고, **인증 토큰을 `HttpOnly` 쿠키로 관리**해 토큰을 클라이언트에 노출하지 않은 채 API와 통신합니다.

```mermaid
flowchart LR
    U([👤 사용자])

    subgraph Web ["apps/web · Next.js (Vercel)"]
        Client["Client Components<br/>(UI / 인터랙션)"]
        BFF["BFF Layer<br/>(Server Components · Route Handlers · Proxy)"]
        Client -->|데이터 요청| BFF
    end

    U --> Client
    BFF -->|집계 · DTO 변환 · 인증 토큰 부착| API["apps/api · NestJS (Railway)"]
    API -->|Prisma| DB[("PostgreSQL · Neon")]
    API --> OA(["OpenAI · Function Calling"])
```

| 패키지                  | 역할                                                                                                                           |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **`apps/web`**          | Next.js App Router. Server Component/Route Handler가 DB에 직접 접근하지 않고, 데이터를 정제해 API로 전달하는 **BFF 역할** 수행 |
| **`apps/api`**          | NestJS. 모든 비즈니스 로직 · AI 호출 · 인증 담당                                                                               |
| **`packages/database`** | Prisma 스키마 + 마이그레이션 (`@fitfoyo/database`)                                                                             |

<br/>

## 🛠 기술 스택

| 영역             | 스택                                                                       |
| :--------------- | :------------------------------------------------------------------------- |
| **모노레포**     | TurboRepo · pnpm 9                                                         |
| **프론트엔드**   | Next.js 16 · React 19 · Tailwind CSS 4 · Zustand 5 · React Hook Form + Zod |
| **백엔드**       | NestJS 11 · OpenAI SDK 6 (Function Calling)                                |
| **데이터베이스** | PostgreSQL(Neon) · Prisma 6                                                |
| **언어 · 품질**  | TypeScript 5.9 · ESLint · Jest                                             |
| **배포 · CI**    | Vercel(web) · Railway(api) · Neon(db) · GitHub Actions                     |

#### ⚡ 성능·정확도 개선

| 항목                         |   Before    |      After      | 조치                             |
| :--------------------------- | :---------: | :-------------: | :------------------------------- |
| 월간 캘린더 전환             | `500~640ms` | **요청 `0회`**  | 스냅샷 캐시 + 인접 월 프리페치   |
| 칼로리 추정 (불닭볶음면 2봉) | `4,000kcal` | **`1,061kcal`** | 식약처 영양성분 기준 서버 재계산 |

<sub>월간 캘린더: prod 측정(2026-08). Before = 캐시가 없을 때 월 데이터 요청 시간, After = 이미 받았거나 미리 받아둔 달로 이동할 때.<br/>불닭볶음면: 식약처 379kcal/100g × 2봉 280g = 1,061kcal. Before는 AI가 칼로리를 직접 답했을 때.</sub>

<br/>

## 📱 UI/UX 미리보기

<!-- 데모 GIF: apps/web/public/*.gif (레포 상대경로 → GitHub에서 자동재생·루프) -->

<table>
  <tr>
    <td width="62%"><img src="apps/web/public/ai-chat.gif" width="480" alt="AI 자연어 기록" /></td>
    <td valign="middle">
      <h3>🗣️ 편한 기록</h3>
      말하듯 한 줄 적으면 AI가 식단·운동을 각각 구분해 기록하고,<br/>수정·삭제도 대화로 처리합니다.
    </td>
  </tr>
  <tr>
    <td width="62%"><img src="apps/web/public/calorie.gif" width="480" alt="칼로리 추정·보정" /></td>
    <td valign="middle">
      <h3>🎯 양심적인 칼로리 계산</h3>
      식약처 데이터에 있는 음식은 공식 값으로 다시 계산하고,<br/>없는 음식은 <b>추정</b> 배지를 붙여 표시합니다.
    </td>
  </tr>
  <tr>
    <td width="62%"><img src="apps/web/public/calendar.gif" width="480" alt="월간 캘린더" /></td>
    <td valign="middle">
      <h3>🗓️ 한눈에 보기</h3>
      날짜별 끼니 정리·칼로리 합계·맞춤 추천을<br/>달력 한 화면에서 확인합니다.
    </td>
  </tr>
</table>

<br/>

## ⚙️ 설치 및 실행

전제 — **pnpm**, Node 20+, 로컬 PostgreSQL(또는 Neon)

```bash
pnpm install          # 1. 의존성 설치
                      # 2. 각 앱에 .env 생성 (아래 참고)
pnpm db:migrate       # 3. DB 마이그레이션
pnpm db:generate      #    Prisma Client 생성
pnpm dev              # 4. web + api 동시 실행
```

**환경변수** (이름만 — 실제 값은 각자 `.env`)

```bash
# apps/api/.env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...            # JWT_SECRET 과 다른 값
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
FOOD_API_KEY=...                  # 공공데이터포털 식약처 영양성분 API 키 (없으면 전부 AI 추정값)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...

# apps/web/.env
API_URL=http://localhost:4000     # BFF가 호출할 API 주소
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**자주 쓰는 스크립트**

```bash
pnpm build            # 전체 빌드
pnpm lint             # 린트
pnpm test             # 테스트
pnpm db:studio        # Prisma Studio
pnpm --filter web dev # 특정 앱만
```

<br/>

## 📂 프로젝트 구조

```
fit-foyo/
├─ apps/
│  ├─ web/          # Next.js (BFF · UI)
│  └─ api/          # NestJS (도메인 로직 · AI · 인증)
├─ packages/
│  └─ database/     # Prisma 스키마 · 마이그레이션 (@fitfoyo/database)
└─ turbo.json
```

<br/>

## 💡 주요 기술적 고민

**1. 대화형 AI 에이전트 — Function Calling 2-pass 루프**

단발 파싱이 아니라 여러 턴을 이어가는 에이전트로 설계했습니다. **pass 1**에서 `tools`(record/update/delete)로 LLM이 작업을 결정하면 서버가 실제 CRUD를 수행하고, **pass 2**에서 `json_object`로 자연어 답변과 추천을 생성합니다. 병렬 tool 호출로 혼합 입력("먹고 뛰었어")을 식단·운동 각각의 레코드로 분리했습니다. 대화 히스토리는 DB 대신 `sessionStorage`로만 유지해 **토큰 비용과 UX** 사이의 트레이드오프를 명시적으로 선택했습니다. 식단을 기록하기 직전에는 그 날의 기존 기록과 대조해, 같은 끼니에 더한 음식은 기존 기록에 덧붙이고 이미 기록된 음식은 넣기 전에 한 번 더 묻습니다.

**2. 칼로리 정확도 — 숫자는 서버가 계산**

LLM에게 칼로리를 직접 답하게 하면 브랜드·가공식품에서 크게 틀릴 수 있습니다(불닭볶음면 2봉을 4,000kcal로 추정). 그래서 LLM에게서는 음식 이름·양과 함께 100g당 열량·무게 추정치를 받고, 최종 칼로리는 서버가 계산합니다. 서버는 음식 이름으로 **식약처 공공 영양성분 데이터**를 조회해 `FoodNutrition`에 저장해 두고, 같은 음식은 다시 조회하지 않습니다. 열량과 먹은 양이 둘 다 근거 있는 값(식약처 열량 + 사용자가 말한 g 또는 포장 내용량)일 때만 확정값으로 기록하고, 그 외에는 "추정" 배지를 붙입니다. 식약처에 없는 이름은 30일 동안 다시 조회하지 않고, 처음 추정한 값을 음식 이름별로 기억해 같은 음식은 언제 말해도 같은 칼로리로 기록합니다. 불닭볶음면 2봉이 `4,000 → 1,061kcal`(379kcal/100g × 280g)로 계산되는지 회귀 테스트로 확인합니다.

**3. 인증 — Refresh 토큰 회전 + BFF 쿠키**

Access/Refresh **토큰 회전(rotation)** 기반으로 재인증하며, Refresh 해시를 `bcrypt.compare`로 매치합니다. 토큰은 클라이언트 스토리지가 아니라 **`HttpOnly`·`Secure` 쿠키**로 BFF 계층에서 발급·갱신합니다. Google OAuth를 연동했고, 크로스도메인 쿠키 핸드오프 문제를 처리했습니다.

**4. 비용·보안 방어**

게스트의 AI 사용 **횟수 상한**과, 생성 후 24시간이 지난 데이터를 **하드 삭제하는 Cron**을 두었습니다. `@nestjs/throttler` Rate Limit, `helmet`, CORS 화이트리스트, `ValidationPipe` 입력 검증, 헬스케어 도메인 이탈 필터를 적용했습니다.

**5. 프론트엔드 성능·UX**

월간 캘린더 전환을 스냅샷 캐시와 인접 월 프리페치로 개선했습니다. prod에서 캐시가 없을 때 월 데이터 요청은 **500~640ms**였고, 이미 받았거나 미리 받아둔 달로 이동할 때는 **요청 없이** 바로 표시됩니다. Optimistic UI(Zustand), 지연 로딩 스켈레톤, 스트리밍(`loading.tsx`)을 적용했습니다.

<br/>

## 🙋 기여자

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/smnm1998">
        <img src="https://github.com/smnm1998.png" width="80" style="border-radius:50%" alt="smnm1998" /><br/>
        <b>smnm1998</b>
      </a>
    </td>
  </tr>
</table>

<div align="center">
<br/>
<sub>개인 포트폴리오 목적으로 제작 · 운영되는 프로젝트입니다.</sub>
</div>
