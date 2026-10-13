import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RecordType } from '@fitfoyo/database';
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

describe('RecordsService.appendDietItems', () => {
  let service: RecordsService;
  let prisma: {
    record: { findUnique: jest.Mock; update: jest.Mock };
    dietItem: { deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      record: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'r1',
          userId: 'u1',
          type: RecordType.DIET,
          rawInput: '점심에 샐러드 먹었어',
        }),
        update: jest.fn().mockResolvedValue({ id: 'r1' }),
      },
      dietItem: { deleteMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [RecordsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(RecordsService);
  });

  it('기존 항목을 지우지 않고 새 항목만 추가한다.', async () => {
    await service.appendDietItems('u1', 'r1', [{ name: '쌀밥' }], '점심에 밥도 추가해줘');

    const arg = prisma.record.update.mock.calls[0]?.[0] as {
      data: { dietItems: unknown; rawInput: string };
    };
    expect(prisma.dietItem.deleteMany).not.toHaveBeenCalled();
    expect(arg.data.dietItems).toEqual({ create: [{ name: '쌀밥' }] });
    expect(arg.data.rawInput).toBe('점심에 샐러드 먹었어\n점심에 밥도 추가해줘');
  });

  it('남의 기록에는 덧붙일 수 없다.', async () => {
    await expect(service.appendDietItems('other', 'r1', [{ name: '쌀밥' }])).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('운동 기록에는 음식을 덧붙일 수 없다.', async () => {
    prisma.record.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      type: RecordType.EXERCISE,
      rawInput: '30분 조깅',
    });

    await expect(service.appendDietItems('u1', 'r1', [{ name: '쌀밥' }])).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.record.update).not.toHaveBeenCalled();
  });
});
