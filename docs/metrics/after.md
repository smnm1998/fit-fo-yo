# 지표 스냅샷: after

- 측정: 2026-11-27 · 커밋 `b7a5f85` · 로컬 Node v22.23.5
- 명령: `node scripts/metrics.mjs after`

| 지표                                        | 값                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 운영 의존성 취약점 (`pnpm audit --prod`)    | 1 (심각 0 · 높음 1 · 보통 0 · 낮음 0)                                                                                                                            |
| api 테스트                                  | 144 / 144 통과                                                                                                                                                   |
| api 커버리지 (lines / branches)             | 59.07% / 56.66%                                                                                                                                                  |
| web 테스트 파일                             | 8                                                                                                                                                                |
| 런타임 검증 없는 API 응답 (`request<T>`)    | 0                                                                                                                                                                |
| 에러 바운더리 파일                          | 3                                                                                                                                                                |
| 레포에 있는 에이전트 지침 파일 (`.claude/`) | 9                                                                                                                                                                |
| `.claude/settings.json` (훅·권한)           | 있음                                                                                                                                                             |
| CI 실행 단계 (`run:`)                       | 8                                                                                                                                                                |
| 가장 큰 파일                                | `apps/api/src/ai/schemas/function-schemas.ts` 292줄 · `apps/web/app/page.tsx` 274줄 · `apps/web/components/dashboard/day-panel/record-info/RecordCard.tsx` 253줄 |

<details><summary>원본 JSON</summary>

```json
{
  "label": "after",
  "date": "2026-11-27",
  "commit": "b7a5f85",
  "node": "v22.23.5",
  "audit": {
    "critical": 0,
    "high": 1,
    "moderate": 0,
    "low": 0,
    "total": 1
  },
  "api": {
    "tests": 144,
    "passed": 144,
    "lines": 59.07,
    "branches": 56.66
  },
  "webTestFiles": 8,
  "uncheckedRequests": 0,
  "errorBoundaries": 3,
  "harness": {
    "agentFiles": 9,
    "settings": true,
    "ciRunSteps": 8
  },
  "largestFiles": [
    {
      "file": "apps/api/src/ai/schemas/function-schemas.ts",
      "lines": 292
    },
    {
      "file": "apps/web/app/page.tsx",
      "lines": 274
    },
    {
      "file": "apps/web/components/dashboard/day-panel/record-info/RecordCard.tsx",
      "lines": 253
    }
  ]
}
```

</details>
