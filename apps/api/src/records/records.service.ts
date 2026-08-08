import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RecordType } from '@fitfoyo/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecordDto) {
    this.assertTypeMatchesItems(dto);

    const data: Prisma.RecordCreateInput = {
      user: { connect: { id: userId } },
      type: dto.type,
      rawInput: dto.rawInput ?? '',
      parsedJson: dto as unknown as Prisma.InputJsonValue,
      recordedAt: new Date(dto.recordedAt),
      ...(dto.type === RecordType.DIET && dto.dietItems
        ? { dietItems: { create: dto.dietItems } }
        : {}),
      ...(dto.type === RecordType.EXERCISE && dto.exerciseItems
        ? { exerciseItems: { create: dto.exerciseItems } }
        : {}),
    };

    const record = await this.prisma.record.create({
      data,
      include: { dietItems: true, exerciseItems: true },
    });
    return record;
  }

  async createFromParsed(params: {
    userId: string;
    type: RecordType;
    rawInput: string;
    parsedJson: Prisma.InputJsonValue;
    recordedAt: Date;
    dietItems?: Prisma.DietItemCreateWithoutRecordInput[];
    exerciseItems?: Prisma.ExerciseItemCreateWithoutRecordInput[];
  }) {
    const record = await this.prisma.record.create({
      data: {
        user: { connect: { id: params.userId } },
        type: params.type,
        rawInput: params.rawInput,
        parsedJson: params.parsedJson,
        recordedAt: params.recordedAt,
        ...(params.dietItems?.length ? { dietItems: { create: params.dietItems } } : {}),
        ...(params.exerciseItems?.length
          ? { exerciseItems: { create: params.exerciseItems } }
          : {}),
      },
      include: { dietItems: true, exerciseItems: true },
    });
    return record;
  }

  async findAll(userId: string, query: QueryRecordsDto) {
    const where: Prisma.RecordWhereInput = {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? {
            recordedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const items = await this.prisma.record.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: query.limit,
      skip: query.offset,
      include: { dietItems: true, exerciseItems: true },
    });

    return { items, total: items.length, limit: query.limit, offset: query.offset };
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.record.findUnique({
      where: { id },
      include: { dietItems: true, exerciseItems: true },
    });
    if (!record) throw new NotFoundException('Record not found');
    if (record.userId !== userId) throw new ForbiddenException();
    return record;
  }

  async update(userId: string, id: string, dto: UpdateRecordDto) {
    const existing = await this.findOne(userId, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.dietItems) {
        await tx.dietItem.deleteMany({ where: { recordId: id } });
      }
      if (dto.exerciseItems) {
        await tx.exerciseItem.deleteMany({ where: { recordId: id } });
      }

      return tx.record.update({
        where: { id },
        data: {
          ...(dto.recordedAt ? { recordedAt: new Date(dto.recordedAt) } : {}),
          ...(dto.rawInput !== undefined ? { rawInput: dto.rawInput } : {}),
          parsedJson: {
            ...((existing.parsedJson as object) ?? {}),
            ...dto,
          } as unknown as Prisma.InputJsonValue,
          ...(dto.dietItems ? { dietItems: { create: dto.dietItems } } : {}),
          ...(dto.exerciseItems ? { exerciseItems: { create: dto.exerciseItems } } : {}),
        },
        include: { dietItems: true, exerciseItems: true },
      });
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.record.delete({ where: { id } });
    return { ok: true };
  }

  private assertTypeMatchesItems(dto: CreateRecordDto) {
    if (dto.type === RecordType.DIET && dto.exerciseItems?.length) {
      throw new BadRequestException('type=DIET 인 record 에 exerciseItems 가 포함될 수 없습니다');
    }
    if (dto.type === RecordType.EXERCISE && dto.dietItems?.length) {
      throw new BadRequestException('type=EXERCISE 인 record 에 dietItems 가 포함될 수 없습니다');
    }
  }
}
