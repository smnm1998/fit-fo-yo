/**
 * AI 채팅 토큰 사용량 측정 (README "대화형 AI 에이전트"의 수치)
 *
 * 1) 고정 시나리오 보내기:  node scripts/chat-tokens.mjs run <apiBase> <recordedAt ISO>
 *    - 게스트를 새로 만들어 6턴(기록·운동·질문·덧붙이기·삭제·도메인 밖)을 순서대로 보낸다
 *    - 턴마다 작업 결과(mutations)와 답변을 출력 → 전후 동작이 같은지 비교
 *    - 사용자 OpenAI 키로 턴당 2회 호출되고, 그 DB에 게스트 기록이 생긴다(24시간 뒤 자동 삭제)
 * 2) 서버 로그 합산:      node scripts/chat-tokens.mjs sum <api 로그 파일>
 *    - api가 턴마다 남기는 `chat usage {...}` 줄을 모아 턴당 평균을 낸다
 *
 * 측정 조건을 같게: 같은 모델, 같은 시나리오, 2회 이상, 회차마다 다른 recordedAt
 */
import { readFileSync } from 'node:fs';

const TURNS = [
  '점심에 김치찌개랑 공기밥 먹었어',
  '저녁에 러닝 30분 했어',
  '오늘 총 몇 칼로리 먹었어?',
  '점심에 계란후라이 하나도 추가해줘',
  '러닝 기록은 지워줘',
  '파이썬으로 피보나치 코드 짜줘',
];

const [mode, ...args] = process.argv.slice(2);
if (mode === 'run' && args.length === 2) await run(args[0], args[1]);
else if (mode === 'sum' && args.length === 1) sum(args[0]);
else {
  console.error('사용법: node scripts/chat-tokens.mjs run <apiBase> <recordedAt> | sum <logFile>');
  process.exit(1);
}

async function run(base, recordedAt) {
  const guest = await fetch(`${base}/api/auth/guest`, { method: 'POST' });
  if (!guest.ok) throw new Error(`게스트 발급 실패 ${guest.status}`);
  const { tokens } = await guest.json();

  const history = [];
  for (const [i, text] of TURNS.entries()) {
    history.push({ role: 'user', content: text });
    const res = await fetch(`${base}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ messages: history, recordedAt }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`${i + 1}턴 ${res.status} ${JSON.stringify(body)}`);
    history.push({ role: 'assistant', content: body.reply });

    const { created, updated, deletedIds } = body.mutations;
    console.log(
      `${i + 1}턴 생성 ${created.length} · 수정 ${updated.length} · 삭제 ${deletedIds.length} | ${body.reply}`,
    );
    await new Promise((r) => setTimeout(r, 4500)); // chat 15회/분 제한
  }
}

function sum(file) {
  const turns = readFileSync(file, 'utf8')
    .replace(/\x1b\[[0-9;]*m/gu, '') // Nest 로그 색상 코드
    .split('\n')
    .map((line) => /chat usage (\{.*\})/u.exec(line)?.[1])
    .filter(Boolean)
    .map((json) => JSON.parse(json));
  if (turns.length === 0) {
    console.error('chat usage 줄이 없습니다.');
    process.exit(1);
  }

  const avg = (pick) => Math.round(turns.reduce((a, t) => a + pick(t), 0) / turns.length);
  const pass1 = avg((t) => t.pass1.input);
  const pass2 = avg((t) => t.pass2.input);
  console.log(`턴 ${turns.length}개 평균`);
  console.log(`입력 ${pass1 + pass2} (1차 ${pass1} / 2차 ${pass2})`);
  console.log(`출력 ${avg((t) => t.pass1.output + t.pass2.output)}`);
  console.log(`캐시 할인된 입력 ${avg((t) => t.pass1.cached + t.pass2.cached)}`);
}
