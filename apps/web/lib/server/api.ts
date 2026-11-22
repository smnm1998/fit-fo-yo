import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

/** 비인증 호출 (login/setup) */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, { ...init, cache: 'no-store' });
}

/** 인증 호출 - 쿠키의 access_token을 Bearer로 부착 */
export async function apiFetchAuth(path: string, init?: RequestInit): Promise<Response> {
  const token = (await cookies()).get('access_token')?.value;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}

/** 업스트림 API 응답을 안전하게 BFF 응답으로 변환 */
export async function proxyJson(
  res: Response,
): Promise<{ ok: boolean; data: unknown; response: NextResponse }> {
  // 204/205는 본문을 가질 수 없다 - NextResponse.json(null, 204)는 스펙 위반
  if (res.status === 204 || res.status === 205) {
    return { ok: true, data: null, response: new NextResponse(null, { status: res.status }) };
  }

  const text = await res.text();

  // 빈 본문(204 등)은 파싱 시도 자체를 건너뛴다.
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // API가 JSON이 아닌 걸 줬다 -> 프록시 HTML, 게이트웨이 등
      return {
        ok: false,
        data: null,
        response: NextResponse.json(
          { message: '서버 응답을 해석할 수 없습니다.' },
          { status: res.ok ? 502 : res.status },
        ),
      };
    }
  }

  return {
    ok: res.ok,
    data,
    response: NextResponse.json(data, { status: res.status }),
  };
}

/** fetch 자체가 실패했을 때(API 다운/타임아웃) 502로 변환 */
export function upstreamDown(error: unknown, path: string): NextResponse {
  console.error(`[BFF] upstream unreachable: ${path}`, error);
  return NextResponse.json(
    { message: '서비스에 일시적으로 연결할 수 없습니다. 잠시 후에 다시 시도해 주세요.' },
    { status: 502 },
  );
}

/** 인증 프록시 - 가공 없이 그대로 전달하는 라우트용 (try/catch + 파싱 포함) */
export async function proxyAuth(path: string, init?: RequestInit): Promise<NextResponse> {
  try {
    const res = await apiFetchAuth(path, init);
    return (await proxyJson(res)).response;
  } catch (error) {
    return upstreamDown(error, path);
  }
}
