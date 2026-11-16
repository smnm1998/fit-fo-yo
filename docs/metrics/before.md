# 지표 스냅샷: before

- 측정: 2026-11-16 · 커밋 `b229631` · 로컬 Node v22.23.5
- 명령: `node scripts/metrics.mjs before`

| 지표                                        | 값                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 운영 의존성 취약점 (`pnpm audit --prod`)    | 1 (심각 0 · 높음 1 · 보통 0 · 낮음 0)                                                                                       |
| api 테스트                                  | 113 / 113 통과                                                                                                              |
| api 커버리지 (lines / branches)             | 47.81% / 47.42%                                                                                                             |
| web 테스트 파일                             | 0                                                                                                                           |
| 런타임 검증 없는 API 응답 (`request<T>`)    | 13                                                                                                                          |
| 에러 바운더리 파일                          | 1                                                                                                                           |
| 레포에 있는 에이전트 지침 파일 (`.claude/`) | 0                                                                                                                           |
| `.claude/settings.json` (훅·권한)           | 없음                                                                                                                        |
| CI 실행 단계 (`run:`)                       | 7                                                                                                                           |
| 가장 큰 파일                                | `apps/api/src/ai/ai.service.ts` 548줄 · `apps/api/src/ai/schemas/function-schemas.ts` 292줄 · `apps/web/app/page.tsx` 273줄 |

<details><summary>원본 JSON</summary>

```json
{
  "label": "before",
  "date": "2026-11-16",
  "commit": "b229631",
  "node": "v22.23.5",
  "audit": {
    "critical": 0,
    "high": 1,
    "moderate": 0,
    "low": 0,
    "total": 1
  },
  "api": {
    "tests": 113,
    "passed": 113,
    "lines": 47.81,
    "branches": 47.42
  },
  "webTestFiles": 0,
  "uncheckedRequests": 13,
  "errorBoundaries": 1,
  "harness": {
    "agentFiles": 0,
    "settings": false,
    "ciRunSteps": 7
  },
  "largestFiles": [
    {
      "file": "apps/api/src/ai/ai.service.ts",
      "lines": 548
    },
    {
      "file": "apps/api/src/ai/schemas/function-schemas.ts",
      "lines": 292
    },
    {
      "file": "apps/web/app/page.tsx",
      "lines": 273
    }
  ]
}
```

</details>
