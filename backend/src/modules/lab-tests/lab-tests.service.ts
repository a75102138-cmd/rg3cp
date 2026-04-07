import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  requireDocument,
  requireActor,
  requireMaterial,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { LAB_TEST_SORT, QueryLabTestDto } from './dto/query-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';

@Injectable()
export class LabTestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextCode(zoneId: string): Promise<string> {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId }, select: { code: true } });
    if (!zone) throw new NotFoundException('Zone not found');
    const prefix = `${zone.code}-LAB-`;
    const count = await this.prisma.labTest.count({ where: { zoneId } });
    let n = count + 1;
    for (let i = 0; i < 2000; i++) {
      const code = `${prefix}${String(n).padStart(3, '0')}`;
      const exists = await this.prisma.labTest.findFirst({ where: { zoneId, code }, select: { id: true } });
      if (!exists) return code;
      n += 1;
    }
    return `${prefix}${Date.now().toString(36).toUpperCase()}`;
  }

  private orderBy(q: QueryLabTestDto): Prisma.LabTestOrderByWithRelationInput {
    const field =
      q.sortBy && LAB_TEST_SORT.includes(q.sortBy as (typeof LAB_TEST_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async validate(dto: {
    zoneId: string;
    materialId?: string | null;
    laboratoryActorId?: string | null;
    documentId?: string | null;
  }) {
    await requireZone(this.prisma, dto.zoneId);
    if (dto.materialId) await requireMaterial(this.prisma, dto.materialId);
    if (dto.laboratoryActorId) await requireActor(this.prisma, dto.laboratoryActorId);
    if (dto.documentId) await requireDocument(this.prisma, dto.documentId);
  }

  async create(dto: CreateLabTestDto) {
    await this.validate(dto);
    const code = await this.nextCode(dto.zoneId);
    try {
      return await this.prisma.labTest.create({
        data: {
          zoneId: dto.zoneId,
          materialId: dto.materialId,
          laboratoryActorId: dto.laboratoryActorId,
          laboratoryName: dto.laboratoryName?.trim() || undefined,
          documentId: dto.documentId,
          code,
          labTestType: dto.labTestType,
          result: dto.result,
          testedAt: dto.testedAt ? new Date(dto.testedAt) : undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryLabTestDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.LabTestWhereInput = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.materialId) where.materialId = query.materialId;
    if (query.laboratoryName?.length) {
      where.laboratoryName = { contains: query.laboratoryName, mode: 'insensitive' };
    }
    if (query.labTestType) where.labTestType = query.labTestType;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { laboratoryName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.labTest.count({ where }),
      this.prisma.labTest.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          zone: true,
          material: true,
          laboratoryActor: true,
          reportDocument: true,
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const t = await this.prisma.labTest.findUnique({
      where: { id },
      include: {
        zone: true,
        material: true,
        laboratoryActor: true,
        reportDocument: true,
      },
    });
    if (!t) throw new NotFoundException('Lab test not found');
    return t;
  }

  async update(id: string, dto: UpdateLabTestDto) {
    const existing = await this.findOne(id);
    await this.validate({
      zoneId: dto.zoneId ?? existing.zoneId,
      materialId: dto.materialId !== undefined ? dto.materialId : existing.materialId,
      laboratoryActorId:
        dto.laboratoryActorId !== undefined ? dto.laboratoryActorId : existing.laboratoryActorId,
      documentId: dto.documentId !== undefined ? dto.documentId : existing.documentId,
    });
    try {
      return await this.prisma.labTest.update({
        where: { id },
        data: {
          zoneId: dto.zoneId,
          materialId: dto.materialId,
          laboratoryActorId: dto.laboratoryActorId,
          laboratoryName: dto.laboratoryName !== undefined ? dto.laboratoryName?.trim() || null : undefined,
          documentId: dto.documentId,
          labTestType: dto.labTestType,
          result: dto.result,
          testedAt:
            dto.testedAt !== undefined
              ? dto.testedAt
                ? new Date(dto.testedAt)
                : null
              : undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.labTest.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
