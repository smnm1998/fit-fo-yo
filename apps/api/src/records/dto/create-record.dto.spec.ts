import 'reflect-metadata'; // 데코레이터 메타데이터 (Nest 테스트 모듈을 안 쓰는 파일이라 직접)
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRecordDto, RECORD_LIMITS } from './create-record.dto';

/** ValidationPipe와 같은 방식으로 검사해 실패한 필드 경로만 모은다 */
async function failedFields(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateRecordDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const paths: string[] = [];
  const walk = (list: typeof errors, prefix: string) => {
    for (const e of list) {
      const path = prefix ? `${prefix}.${e.property}` : e.property;
      if (e.constraints) paths.push(path);
      walk(e.children ?? [], path);
    }
  };
  walk(errors, '');
  return paths;
}

const base = { type: 'DIET', recordedAt: '2026-11-26T03:00:00.000Z' };

describe('CreateRecordDto 입력 상한', () => {
  it('보통 입력은 통과한다.', async () => {
    await expect(
      failedFields({ ...base, dietItems: [{ name: '비빔밥', calories: 650, grams: 450 }] }),
    ).resolves.toEqual([]);
  });

  it('DB Int 범위를 넘는 칼로리는 저장 전에 막는다. (전에는 Prisma 오류로 500)', async () => {
    await expect(
      failedFields({ ...base, dietItems: [{ name: '비빔밥', calories: 3_000_000_000 }] }),
    ).resolves.toEqual(['dietItems.0.calories']);
  });

  it('상한 값 자체는 허용하고, 1만 넘어도 막는다.', async () => {
    await expect(
      failedFields({ ...base, dietItems: [{ name: 'a', calories: RECORD_LIMITS.kcal }] }),
    ).resolves.toEqual([]);
    await expect(
      failedFields({ ...base, dietItems: [{ name: 'a', calories: RECORD_LIMITS.kcal + 1 }] }),
    ).resolves.toEqual(['dietItems.0.calories']);
  });

  it('한 기록의 항목 수에도 상한이 있다.', async () => {
    const items = Array.from({ length: RECORD_LIMITS.items + 1 }, (_, i) => ({ name: `음식${i}` }));
    await expect(failedFields({ ...base, dietItems: items })).resolves.toEqual(['dietItems']);
  });

  it('운동 시간은 하루(1440분)를 넘을 수 없다.', async () => {
    await expect(
      failedFields({
        type: 'EXERCISE',
        recordedAt: base.recordedAt,
        exerciseItems: [{ name: '러닝', durationMinutes: 1441 }],
      }),
    ).resolves.toEqual(['exerciseItems.0.durationMinutes']);
  });
});
