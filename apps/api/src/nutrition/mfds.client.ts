import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

/** 식약처 전국통합식품영양성분정보 표준데이터 (공공데이터포탈) - 조회 순서대로 */
export const MFDS_DATASETS = {
  FOOD: {
    url: 'https://api.data.go.kr/openapi/tn_pubr_public_nutri_food_info_api',
    searchBy: 'foodNm',
  },
  PROCESSED: {
    url: 'https://api.data.go.kr/openapi/tn_pubr_public_nutri_process_info_api',
    searchBy: 'foodNm',
  },
  RAW: {
    url: 'https://api.data.go.kr/openapi/tn_pubr_public_nutri_material_info_api',
    // 이름이 '닭고기_가슴(껍질 제거)_삶은것' 형식이라 대표식품명으로 찾는다
    searchBy: 'foodLv4Nm',
  },
} as const;

export type MfdsDataset = keyof typeof MFDS_DATASETS;

/** 계산에 쓸 수 있게 정리한 식약처 행 */
export type MfdsRow = {
  dataset: MfdsDataset;
  foodCd: string;
  foodNm: string;
  originCd: string | null;
  basis: 'g' | 'ml';
  kcalPer100: number;
  sizeGrams: number | null;
  referenceDate: string | null;
};

/** 장애, 시간 초과, 응답 형식 이상 - '0건'과 구분해야 재시도 여부를 정할 수 있음 */
export class MfdsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MfdsUnavailableError';
  }
}

/** 응답 시간 상한 넘으면 장애로 보고 추정치로 넘어감 */
const TIMEOUT_MS = 3000;
const PAGE_SIZE = '100';

/** 빈 문자열, null, 필드 누락을 모두 "값 없음(null)"으로 통일 */
const text = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

const RawRowSchema = z.object({
  foodCd: z.string(),
  foodNm: z.string(),
  foodOriginCd: text,
  nutConSrtrQua: text,
  enerc: text,
  foodSize: text,
  crtrYmd: text,
});

const ResponseSchema = z.object({
  header: z.object({ resultCode: z.string(), resultMsg: z.string() }),
  body: z
    .object({
      items: z.object({ item: z.union([z.array(RawRowSchema), RawRowSchema]) }).nullish(),
      totalCount: z.coerce.number().optional(),
    })
    .nullable(),
});

const BASIS = /^100(g|ml)$/;
const SIZE = /^(\d+(?:\.\d+)?)\s*(?:g|ml)$/;

function toNumber(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 에러 이름을 꺼냄. Error, DOMException(시간 초과) 모두  대응 */
function errorName(e: unknown): string {
  return typeof e === 'object' && e !== null && 'name' in e && typeof e.name === 'string'
    ? e.name
    : 'unknown';
}

/** 100g/100ml 기준이 아니거나 열량이 없는 행은 계산에 못 쓰므로 null */
function toRow(dataset: MfdsDataset, r: z.infer<typeof RawRowSchema>): MfdsRow | null {
  const basis = r.nutConSrtrQua ? BASIS.exec(r.nutConSrtrQua)?.[1] : undefined;
  const kcal = toNumber(r.enerc);
  if ((basis !== 'g' && basis !== 'ml') || kcal === null) return null;

  const size = r.foodSize ? SIZE.exec(r.foodSize)?.[1] : undefined;
  return {
    dataset,
    foodCd: r.foodCd,
    foodNm: r.foodNm,
    originCd: r.foodOriginCd,
    basis,
    kcalPer100: Math.round(kcal),
    sizeGrams: size ? Math.round(Number(size)) : null,
    referenceDate: r.crtrYmd,
  };
}

@Injectable()
export class MfdsClient {
  private readonly logger = new Logger(MfdsClient.name);
  private readonly apiKey: string | null;

  constructor(config: ConfigService) {
    const key = config.get<string>('FOOD_API_KEY');
    if (!key) {
      this.logger.warn(
        '식약처 api key가 없어 식약처 조회를 건너뜁니다. (미등록 음식은 모두 AI 추청',
      );
      this.apiKey = null;
      return;
    }
    // Encoding 키를 넣어도 URLSearchParams가 한 번 더 인코딩하지 않게 원래 형태로
    this.apiKey = key.includes('%') ? decodeURIComponent(key) : key;
  }

  /**
   * 한 데이터 셋에서 검색한다. 0건이면 []
   * 장애, 시간 초과, 응답 형식 이상은 MfdsUnavailableError -> 호출 측이 "다음에 재시도"로 처리
   */
  async search(dataset: MfdsDataset, query: string): Promise<MfdsRow[]> {
    if (!this.apiKey) throw new MfdsUnavailableError('FOOD_API_KEY 없음');

    const { url, searchBy } = MFDS_DATASETS[dataset];
    const endpoint = new URL(url);
    endpoint.search = new URLSearchParams({
      serviceKey: this.apiKey,
      [searchBy]: query,
      pageNo: '1',
      numOfRows: PAGE_SIZE,
      type: 'json',
    }).toString();

    const { status, body } = await this.request(dataset, query, endpoint);
    if (status !== 200) {
      throw new MfdsUnavailableError(`[${dataset}] HTTP ${status}: ${body.slice(0, 200)}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      throw new MfdsUnavailableError(`[${dataset}] JSON이 아닌 응답: ${body.slice(0, 200)}`);
    }

    const parsed = ResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new MfdsUnavailableError(
        `[${dataset}] 응답 형식이 다름\n${z.prettifyError(parsed.error)}`,
      );
    }

    const { header, body: data } = parsed.data;
    if (header.resultCode === '03') return [];
    if (header.resultCode !== '00') {
      throw new MfdsUnavailableError(`[${dataset}] ${header.resultCode} ${header.resultMsg}`);
    }

    const item = data?.items?.item ?? [];
    const list = Array.isArray(item) ? item : [item];
    if ((data?.totalCount ?? 0) > list.length) {
      this.logger.warn(`[${dataset}] "${query} 결과가 ${PAGE_SIZE}건을 넘어 일부만 확인함`);
    }

    const rows = list.map((r) => toRow(dataset, r)).filter((r): r is MfdsRow => r !== null);
    return [...new Map(rows.map((r) => [r.foodCd, r])).values()];
  }

  private async request(
    dataset: MfdsDataset,
    query: string,
    endpoint: URL,
  ): Promise<{ status: number; body: string }> {
    const started = Date.now();
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const body = await res.text();
      this.logger.debug(`[${dataset}] "${query}" ${res.status} ${Date.now() - started}ms`);
      return { status: res.status, body };
    } catch (e) {
      // 시간 초과, 네트워크 오류
      throw new MfdsUnavailableError(`[${dataset}] 요청 실패 (${errorName(e)})`);
    }
  }
}
