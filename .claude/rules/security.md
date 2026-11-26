# 🛡️ Security & AI Guidelines

## 1. Authentication (인증 및 인가)

- **JWT Management:** JWT 토큰은 클라이언트 스토리지(LocalStorage 등)에 저장하지 않습니다.
- 프론트엔드 BFF 계층에서 `HttpOnly`, `Secure` 옵션이 적용된 쿠키로 토큰을 발급하고 관리하세요.
- NestJS(`apps/api`)에는 `helmet` 미들웨어를 적용하고, 프로덕션 배포 시 엄격한 CORS 화이트리스트를 구성하세요.

## 2. AI Engine (OpenAI Integration)

- OpenAI API 호출 로직은 반드시 `apps/api`(NestJS) 내부에 위치해야 합니다.
- **Rate Limiting:** AI 과금 폭주를 막기 위해 `@nestjs/throttler`를 활용하여 엔드포인트에 Rate Limit을 엄격히 적용하세요.
- **Prompt Injection Defense:** `ValidationPipe`를 사용하여 사용자 입력값의 최대 길이를 제한하고 악성 입력을 필터링하세요.
- **Domain Restriction:** 자연어 파싱 시 헬스케어(식단/운동) 도메인을 벗어난 프롬프트가 입력되면, AI 로직에서 `INVALID_DOMAIN` 예외 처리를 반환하도록 프롬프트를 구성하세요.
- AI 파싱의 불완전성을 대비해 반환된 JSON 결과뿐만 아니라, 사용자의 '원본 입력 텍스트(Raw Data)'를 DB(`Record` 테이블)에 함께 저장하세요.

## 3. Cost Optimization (비용 최적화)

- **Guest Data Cleansing:** 게스트 모드에서 생성된 데이터는 방치하지 마세요. NestJS의 `@Cron` 데코레이터를 사용하여 생성 후 24시간이 지난 게스트 데이터는 하드 삭제(Hard Delete)하는 배치 로직을 포함하세요.
