# 🌿 Git Workflow & Commit Conventions

## 1. Branching Strategy (GitHub Flow)

이 프로젝트는 빠르고 유연한 배포를 위해 간소화된 GitHub Flow를 사용합니다.

- `main`: 항상 프로덕션에 배포 가능한 상태를 유지하는 단일 중심 브랜치입니다.
- `develop`: 기능 브랜치 완료/병합 후 최종 테스트 하는 개발 브랜치입니다.
- `feature/*`: 새로운 기능 개발을 위한 브랜치입니다. (예: `feature/ai-parsing`)
- `fix/*`: 버그 수정을 위한 브랜치입니다. (예: `fix/calendar-rendering`)
- **Rule:** 모든 작업은 `main` 브랜치에서 파생(Branch out)되며, 작업이 완료되면 Pull Request(PR)를 통해 다시 `main`으로 병합됩니다.

## 2. Commit Message Conventions

모노레포 아키텍처이므로, 커밋 메시지 작성 시 Conventional Commits를 따르되 **어떤 패키지/앱을 수정했는지 Scope를 반드시 명시**하세요.

- **Format:** `type(scope): message`
- **Types:**
  - `feat`: 새로운 기능 추가
  - `fix`: 버그 수정
  - `refactor`: 코드 리팩토링 (기능 변경 없음)
  - `style`: 코드 포맷팅, 세미콜론 누락 수정 등 (로직 변경 없음)
  - `chore`: 빌드 업무 수정, 패키지 매니저 세팅 등
- **Scopes (Monorepo specific):**
  - `web`: `apps/web` (Next.js) 관련 수정
  - `api`: `apps/api` (NestJS) 관련 수정
  - `db`: `packages/database` 관련 수정
  - `root`: 최상위 설정 파일 수정
- **Example:**
  - `feat(api): OpenAI Function Calling 로직 추가`
  - `fix(web): 캘린더 날짜 선택 시 발생하는 Flickering 현상 수정`

## 3. Pull Request & Merge Rules

- **Squash and Merge:** `main` 브랜치의 히스토리를 깔끔하게 유지하기 위해, 여러 개의 자잘한 커밋은 병합 시 하나의 의미 있는 커밋으로 압축(Squash)합니다.
- **CI First:** 로컬 환경에서는 Husky를 통한 강제 린트/테스트를 생략하여 개발 속도를 높이되, PR을 올린 후 **GitHub Actions CI (Lint, Type Check, Jest)가 통과해야만** Merge 할 수 있습니다.
- **Auto Cleanup:** 머지가 완료된 `feature/`, `fix/` 브랜치는 원격(GitHub)과 로컬에서 즉시 삭제하여 저장소의 혼잡도를 낮춥니다.

## 4. Message Format (Markdown)

커밋 메시지와 PR 본문은 **GitHub UI에서 머지/리뷰**되므로, GitHub이 렌더링하는 **마크다운 형식**으로 작성합니다. CLI(`-m` 플래그)가 아닌 UI(에디터)에서 입력한다고 가정하고 출력하세요.

### Commit Message Body

- **Header**: Conventional Commits 형식 (`type(scope): message`) 유지. 헤더 자체는 평문.
- **Body**: 헤더와 빈 줄로 분리한 뒤 마크다운 사용 가능.
  - `## Changes`, `## Notes` 등의 섹션 헤딩
  - 불릿 리스트 (`-`)
  - 인라인 코드 (`` ` ``) 와 코드 블록 (` ``` `)
  - 강조 (`**bold**`)
- **예시:**

```markdown
feat(api): Refresh 토큰 회전 기반 인증 인프라 구축

## Changes

- `JwtAccessStrategy` / `JwtRefreshStrategy` 분리 등록
- `passReqToCallback`으로 원본 토큰을 `bcrypt.compare` 매치
- `@CurrentUser()` 커스텀 데코레이터 추가

## Notes

- `JWT_REFRESH_SECRET`은 `JWT_SECRET`과 반드시 다른 값
- Rotation 시 옛 hash 즉시 폐기
```

### Pull Request Body

PR 본문은 더 풍부한 마크다운 섹션 구성을 사용합니다.

- `## Summary` — 한두 문단 요약
- `## Changes` — 주요 변경사항 불릿
- `## Verification` — 검증 단계 체크리스트 (`- [x]`, `- [ ]`)
- `## Notes` / `## Next` — 부가 사항 (선택)
- 명령어/스니펫은 코드 블록으로 강조

### 출력 시 주의

AI Assistant가 커밋/PR 메시지를 출력할 때:

- **CLI용 escaping(`\`` 등) 대신 순수 마크다운으로 출력**
- 사용자가 GitHub UI 에디터에 그대로 복사·붙여넣기 할 수 있도록
- 헤더 줄과 본문 사이 빈 줄을 명확히 두기
