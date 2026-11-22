/**
 * 리팩토링 전후 지표 스냅샷
 * - 사용: node scripts/metrics.mjs <label> -> docs/metrics/<label>.md
 * - before/after를 같은 명령으로 잰다. 문서+README의 수치는 이 출력만 씀
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const label = process.argv[2];
if (!label) {
  console.error('사용법: node scripts/metrics.mjs <label>');
  process.exit(1);
}

/** 명령 실행 결과(stdout). 실패해도 출력은 쓴다 (pnpm audit은 취약점이 있으면 exit 1) */
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout?.toString() ?? '';
  }
}

const lines = (out) => out.split('\n').filter(Boolean);
const tracked = (path) => lines(run(`git ls-files ${path}`));

function audit() {
  const { metadata } = JSON.parse(run('pnpm audit --prod --json'));
  const { critical, high, moderate, low } = metadata.vulnerabilities;
  return { critical, high, moderate, low, total: critical + high + moderate + low };
}

function apiTests() {
  run(
    'pnpm --filter api exec jest --silent --coverage --coverageReporters=json-summary --json --outputFile=coverage/jest-result.json',
  );
  const result = JSON.parse(readFileSync('apps/api/coverage/jest-result.json', 'utf8'));
  const { total } = JSON.parse(readFileSync('apps/api/coverage/coverage-summary.json', 'utf8'));
  return {
    tests: result.numTotalTests,
    passed: result.numPassedTests,
    lines: total.lines.pct,
    branches: total.branches.pct,
  };
}

function webTestFiles() {
  return tracked('apps/web').filter((f) => /\.(test|spec)\.tsx?$/.test(f)).length;
}

/** 응답을 런타임 검증 없이 캐스팅만 하는 호출 (request<T>) */
function uncheckedRequests() {
  return lines(run('git grep -n "request<" -- apps/web')).filter(
    (l) => !l.includes('function request'),
  ).length;
}

function errorBoundaries() {
  return tracked('apps/web/app').filter((f) => /(error|global-error|not-found)\.tsx$/.test(f))
    .length;
}

function harness() {
  const workflow = tracked('.github/workflows')
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

  return {
    agentFiles: tracked('.claude').length,
    settings: existsSync('.claude/settings.json'),
    ciRunSteps: (workflow.match(/^\s+run:/gm) ?? []).length,
  };
}

function largestFiles(n = 3) {
  const files = tracked('apps/web apps/api/src').filter(
    (f) => /\.tsx?$/.test(f) && !/\.(test|spec)\.tsx?$/.test(f),
  );
  return files
    .map((f) => ({ file: f, lines: readFileSync(f, 'utf8').trimEnd().split('\n').length }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, n);
}

const m = {
  label,
  date: new Date().toISOString().slice(0, 10),
  commit: run('git rev-parse --short HEAD').trim(),
  node: process.version,
  audit: audit(),
  api: apiTests(),
  webTestFiles: webTestFiles(),
  uncheckedRequests: uncheckedRequests(),
  errorBoundaries: errorBoundaries(),
  harness: harness(),
  largestFiles: largestFiles(),
};

const md = `# 지표 스냅샷: ${m.label}

- 측정: ${m.date} · 커밋 \`${m.commit}\` · 로컬 Node ${m.node}
- 명령: \`node scripts/metrics.mjs ${m.label}\`

| 지표 | 값 |
| --- | --- |
| 운영 의존성 취약점 (\`pnpm audit --prod\`) | ${m.audit.total} (심각 ${m.audit.critical} · 높음 ${m.audit.high} · 보통 ${m.audit.moderate} · 낮음 ${m.audit.low}) |
| api 테스트 | ${m.api.passed} / ${m.api.tests} 통과 |
| api 커버리지 (lines / branches) | ${m.api.lines}% / ${m.api.branches}% |
| web 테스트 파일 | ${m.webTestFiles} |
| 런타임 검증 없는 API 응답 (\`request<T>\`) | ${m.uncheckedRequests} |
| 에러 바운더리 파일 | ${m.errorBoundaries} |
| 레포에 있는 에이전트 지침 파일 (\`.claude/\`) | ${m.harness.agentFiles} |
| \`.claude/settings.json\` (훅·권한) | ${m.harness.settings ? '있음' : '없음'} |
| CI 실행 단계 (\`run:\`) | ${m.harness.ciRunSteps} |
| 가장 큰 파일 | ${m.largestFiles.map((f) => `\`${f.file}\` ${f.lines}줄`).join(' · ')} |

<details><summary>원본 JSON</summary>

\`\`\`json
${JSON.stringify(m, null, 2)}
\`\`\`

</details>
`;

mkdirSync('docs/metrics', { recursive: true });
writeFileSync(`docs/metrics/${label}.md`, md);
console.log(md);
