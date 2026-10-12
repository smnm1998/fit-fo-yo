import { ConfigService } from '@nestjs/config';
import { MfdsClient, MfdsUnavailableError } from './mfds.client';

/** process.env 와 상관없이 키를 정해 주는 가짜 ConfigService */
const configWith = (key?: string) => ({ get: () => key }) as unknown as ConfigService;

/** 식약처 응답 행 (실제 불닭볶음면 응답에서 쓰는 필드만) */
function apiRow(overrides: Record<string, string | null> = {}) {
  return {
    foodCd: 'P108-009000400-0210',
    foodNm: '불닭볶음면',
    foodOriginCd: '1',
    nutConSrtrQua: '100g',
    enerc: '379',
    foodSize: '140g',
    crtrYmd: '2026-06-26',
    ...overrides,
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status });
}

function ok(item: unknown) {
  const totalCount = Array.isArray(item) ? item.length : 1;
  return jsonResponse({
    header: { resultCode: '00', resultMsg: 'NORMAL SERVICE.' },
    body: { items: { item }, numOfRows: 100, pageNo: 1, totalCount },
  });
}

const NODATA = { header: { resultCode: '03', resultMsg: 'NODATA_ERROR' }, body: null };

describe('MfdsClient', () => {
  let fetchMock: jest.SpyInstance;
  let client: MfdsClient;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    client = new MfdsClient(configWith('test-key'));
  });

  afterEach(() => fetchMock.mockRestore());

  /** fetch 에 넘어간 URL 의 쿼리 파라미터 */
  const sentParams = () => (fetchMock.mock.calls[0][0] as URL).searchParams;

  describe('요청', () => {
    it('원재료는 foodLv4Nm 으로 검색하고 키를 serviceKey 로 보낸다', async () => {
      fetchMock.mockResolvedValue(jsonResponse(NODATA));
      await client.search('RAW', '닭고기');

      const params = sentParams();
      expect(params.get('serviceKey')).toBe('test-key');
      expect(params.get('foodLv4Nm')).toBe('닭고기');
      expect(params.get('foodNm')).toBeNull();
      expect(params.get('type')).toBe('json');
    });

    it('Encoding 키(%2B 포함)를 넣어도 원래 키로 보낸다', async () => {
      client = new MfdsClient(configWith('ab%2Bcd%3D%3D'));
      fetchMock.mockResolvedValue(jsonResponse(NODATA));
      await client.search('FOOD', '김치찌개');

      expect(sentParams().get('serviceKey')).toBe('ab+cd==');
    });
  });

  describe('응답 변환', () => {
    it('문자열 값을 계산용 숫자로 바꾼다 (포장 내용량 → 그램)', async () => {
      fetchMock.mockResolvedValue(ok([apiRow()]));

      await expect(client.search('PROCESSED', '불닭볶음면')).resolves.toEqual([
        {
          dataset: 'PROCESSED',
          foodCd: 'P108-009000400-0210',
          foodNm: '불닭볶음면',
          originCd: '1',
          basis: 'g',
          kcalPer100: 379,
          sizeGrams: 140,
          referenceDate: '2026-06-26',
        },
      ]);
    });

    it('빈 문자열과 null 은 값 없음으로 본다 (Number("") = 0 이 되지 않게)', async () => {
      fetchMock.mockResolvedValue(ok([apiRow({ foodSize: '', crtrYmd: null })]));
      const [row] = await client.search('PROCESSED', '불닭볶음면');

      expect(row.sizeGrams).toBeNull();
      expect(row.referenceDate).toBeNull();
    });

    it('100ml 기준(음료)도 받는다', async () => {
      fetchMock.mockResolvedValue(ok([apiRow({ nutConSrtrQua: '100ml', foodSize: '1500ml' })]));
      const [row] = await client.search('PROCESSED', '콜라');

      expect(row.basis).toBe('ml');
      expect(row.sizeGrams).toBe(1500);
    });

    it('열량이 비었거나 기준량을 알 수 없는 행은 뺀다', async () => {
      fetchMock.mockResolvedValue(
        ok([
          apiRow({ foodCd: 'A', enerc: '' }),
          apiRow({ foodCd: 'B', nutConSrtrQua: '1회 제공량' }),
          apiRow({ foodCd: 'C' }),
        ]),
      );
      const rows = await client.search('PROCESSED', '불닭볶음면');

      expect(rows.map((r) => r.foodCd)).toEqual(['C']);
    });

    it('같은 식품코드가 중복으로 오면 한 번만 남긴다', async () => {
      fetchMock.mockResolvedValue(
        ok([apiRow(), apiRow(), apiRow({ foodCd: 'P108-009000400-0194', foodSize: '700g' })]),
      );
      const rows = await client.search('PROCESSED', '불닭볶음면');

      expect(rows.map((r) => r.foodCd)).toEqual(['P108-009000400-0210', 'P108-009000400-0194']);
    });

    it('결과가 1건이라 item 이 객체로 와도 배열로 처리한다', async () => {
      fetchMock.mockResolvedValue(ok(apiRow()));

      await expect(client.search('PROCESSED', '불닭볶음면')).resolves.toHaveLength(1);
    });

    it('NODATA(03)는 에러가 아니라 0건이다', async () => {
      fetchMock.mockResolvedValue(jsonResponse(NODATA));

      await expect(client.search('FOOD', '없는음식')).resolves.toEqual([]);
    });
  });

  describe('장애는 MfdsUnavailableError 로 구분한다', () => {
    it.each([
      ['HTTP 401', () => jsonResponse({ OpenAPI_ServiceResponse: {} }, 401)],
      [
        '00 · 03 이 아닌 resultCode',
        () => jsonResponse({ header: { resultCode: '30', resultMsg: 'KEY_ERROR' }, body: null }),
      ],
      ['응답 형식이 다름', () => jsonResponse({ response: { header: { resultCode: '00' } } })],
      ['JSON 이 아닌 응답', () => new Response('<OpenAPI_ServiceResponse/>', { status: 200 })],
    ])('%s', async (_label, makeResponse) => {
      fetchMock.mockResolvedValue(makeResponse());

      await expect(client.search('FOOD', '김치찌개')).rejects.toBeInstanceOf(MfdsUnavailableError);
    });

    it('시간 초과', async () => {
      fetchMock.mockRejectedValue(new DOMException('timeout', 'TimeoutError'));

      await expect(client.search('FOOD', '김치찌개')).rejects.toThrow('TimeoutError');
    });

    it('키가 없으면 호출하지 않고 바로 장애로 처리한다', async () => {
      client = new MfdsClient(configWith(undefined));

      await expect(client.search('FOOD', '김치찌개')).rejects.toBeInstanceOf(MfdsUnavailableError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
