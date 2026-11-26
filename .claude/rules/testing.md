# 🧪 Testing Conventions

## 1. Test Framework

- 기본 테스트 프레임워크로 `Jest`를 사용합니다. (TypeScript 환경)
- GitHub Actions CI 파이프라인에서 실행될 수 있도록 테스트 스크립트를 구성하세요.

## 2. Unit Testing Rules (NestJS)

- 서비스(Service) 레이어의 비즈니스 로직, 특히 **AI 프롬프트 파싱 로직**과 **일일 정산/추천 로직**에 대한 유닛 테스트를 우선적으로 작성하세요.
- DB 접근(Prisma)과 외부 API(OpenAI) 호출은 반드시 Mocking 하여 순수 비즈니스 로직만 격리하여 테스트하세요.

## 3. Frontend Testing Rules (Next.js)

- 컴포넌트 렌더링보다는 Zustand의 상태 변경 로직, Optimistic UI 업데이트의 정확성, Debounce 훅의 동작 여부 등 상태와 유틸리티 위주로 테스트를 작성하세요.
