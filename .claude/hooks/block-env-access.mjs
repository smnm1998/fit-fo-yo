#!/usr/bin/env node
/**
 * PreToolUse 훅: Claude가 시크릿 env 파일(.env, .env.local, .env.production …)에 닿지 못하게 막는다
 * - 파일 도구: 경로·glob 필드의 각 조각(폴더/파일 이름)을 본다
 * - Bash: 명령 문자열을 토큰으로 나눠 그런 파일 이름이 있으면 막는다
 * - 예시 파일(.env.example · .env.sample · .env.template)은 허용
 * 한계: 변수·와일드카드로 이름을 숨기면 못 잡는다 → CLAUDE.md 지침과 함께 쓰는 가드레일
 */
import { readFileSync } from 'node:fs';

const ALLOWED_SUFFIXES = new Set(['example', 'sample', 'template']);

/** 도구별로 파일 경로가 들어오는 필드 (Grep의 pattern은 내용 검색어라 제외) */
const PATH_FIELDS = {
  Read: ['file_path'],
  Edit: ['file_path'],
  Write: ['file_path'],
  NotebookEdit: ['notebook_path'],
  Grep: ['path', 'glob'],
  Glob: ['pattern', 'path'],
};

const REASON =
  '시크릿 env 파일(.env, .env.local 등)은 읽거나 다룰 수 없습니다. ' +
  '값이 필요하면 사용자에게 물어보세요. 예시 파일(.env.example)은 허용됩니다.';

/** '.env', '.env.<무엇>', '.env*' 이고 예시 파일이 아니면 true */
function isSecretEnvName(name) {
  if (/^\.env\*/u.test(name)) return true;
  const m = /^\.env(?:\.(.+))?$/u.exec(name);
  if (!m) return false;
  return !(m[1] && ALLOWED_SUFFIXES.has(m[1]));
}

/** 경로(또는 glob)의 조각 중 하나라도 시크릿 env 이름이면 true */
function hitsSecret(value) {
  if (typeof value !== 'string' || value === '') return false;
  // 경로 구분은 '/'만 (macOS·Linux CI 전용 레포). '\.env' 같은 정규식 이스케이프를 경로로 오해하지 않게
  return value.split('/').some(isSecretEnvName);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function main() {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const tool = input.tool_name;
  const args = input.tool_input ?? {};

  if (tool === 'Bash') {
    const tokens = String(args.command ?? '').split(/[\s'"`;|&<>()=,:]+/u);
    if (tokens.some(hitsSecret)) deny(REASON);
    return;
  }

  const fields = PATH_FIELDS[tool] ?? [];
  if (fields.some((field) => hitsSecret(args[field]))) deny(REASON);
}

try {
  main();
} catch (error) {
  // 입력을 못 읽으면 통과시키지 않는다 (가드는 실패 시 막는 쪽이 안전)
  deny(`env 가드 훅 오류로 차단: ${error instanceof Error ? error.message : String(error)}`);
}
