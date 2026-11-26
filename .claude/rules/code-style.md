# 🎨 Code Style & Architecture Rules

## 1. Monorepo & Naming Conventions

- **Package Manager:** `pnpm` 명령어만 사용합니다. (`npm`, `yarn` 금지)
- **Naming:**
  - React Component: `PascalCase` (e.g., `ActionCard.tsx`)
  - Logic/Function/Method: `camelCase` (e.g., `useAsyncJob.ts`, `generateDiet`)
  - Folder/Directory: `kebab-case` (e.g., `components/quick-action-card`)
  - Prisma Model: Model은 `PascalCase` (`Record`), Field는 `camelCase` (`createdAt`)
- **Path Aliases:**
  - 앱 내부 import는 `@/*` 단일 alias만 사용 (apps/web → `./*`, apps/api → `./src/*`)
  - 앱끼리 직접 import 금지 — 공유 코드는 반드시 `packages/*`로 분리
  - 워크스페이스 패키지는 alias가 아니라 패키지 이름(`@fitfoyo/database` 등)으로 import

## 2. Architecture: BFF Pattern

- 프론트엔드(`apps/web`)의 Server Component나 Route Handler에서 직접 Database(`Prisma`)에 접근하지 마세요.
- 모든 데이터 변이와 비즈니스 로직은 `apps/api`(NestJS)에서 처리하며, `apps/web`은 데이터를 정제(Aggregation)하고 API로 전달하는 BFF 역할만 수행합니다.

## 3. Frontend UX Directives

- **Optimistic UI:** 데이터 생성/수정/삭제 시, 서버 응답을 기다리지 않고 Zustand 상태를 먼저 업데이트하여 UI에 즉각 반영하세요.
- **Delayed Loading Skeleton:** API 호출 시 화면 깜빡임(Flickering)을 막기 위해, 로딩이 1.5초 이상 지속될 때만 스켈레톤 UI를 렌더링하도록 훅(Hook)을 구성하세요.
- **Debounce:** 수동 입력 필드(예: 메뉴명 작성 시 칼로리 자동 계산)에는 반드시 1초 디바운스를 적용하여 API 호출 빈도를 최적화하세요.
