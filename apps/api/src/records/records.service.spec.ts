import { Test } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRecordsDto } from './dto/query-records.dto';

describe('RecordsService.findAll', () => {
  let service: RecordsService;
  let prisma: {
    record: { findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      record: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [RecordsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(RecordsService);
  });

  /** DTO 기본값 (limit=50, offset=0)을 살린 채로 일부만 덮어둔다. */
  function query(partial: Partial<QueryRecordsDto> = {}): QueryRecordsDto {
    return Object.assign(new QueryRecordsDto(), partial);
  }

  it('total은 페이지 길이가 아니라 조건에 맞춘 전체 건수다.', async () => {
    prisma.record.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
    prisma.record.count.mockResolvedValue(57);

    const result = await service.findAll('u1', query({ limit: 2 }));

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(57);
    expect(result.limit).toBe(2);
  });

  it('count는 findMany와 완전히 같은 where로 부른다.', async () => {
    prisma.record.findMany.mockResolvedValue([]);
    prisma.record.count.mockResolvedValue(0);

    await service.findAll('u1', query({ from: '2026-09-01T00:00:00.000Z' }));

    const listArgs = prisma.record.findMany.mock.calls[0]?.[0] as { where: unknown };
    const countArgs = prisma.record.count.mock.calls[0]?.[0] as { where: unknown };
    expect(countArgs.where).toEqual(listArgs.where);
  });

  it('목록과 개수를 한 트랜잭션으로 묶는다.', async () => {
    prisma.record.findMany.mockResolvedValue([]);
    prisma.record.count.mockResolvedValue(0);

    await service.findAll('u1', query());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
