import { resolveRecordedAt, toValidDate } from './tool-args';

describe('tool-args 날짜', () => {
  it('해석할 수 없는 문자열은 null이다.', () => {
    expect(toValidDate('어제 점심')).toBeNull();
    expect(toValidDate('2026-13-45')).toBeNull();
    expect(toValidDate(undefined)).toBeNull();
    expect(toValidDate('')).toBeNull();
  });

  it('모델 값 -> 보고 있던 날짜 -> 지금 순서로, 해석되는 첫 값을 쓴다.', () => {
    const fallback = '2026-09-10T03:00:00.000Z';
    expect(resolveRecordedAt('2026-09-09T03:00:00.000Z', fallback)).toEqual(
      new Date('2026-09-09T03:00:00.000Z'),
    );
    expect(resolveRecordedAt('엊그제', fallback)).toEqual(new Date(fallback));
    expect(Number.isNaN(resolveRecordedAt('엊그제', 'bad').getTime())).toBe(false);
  });
});
