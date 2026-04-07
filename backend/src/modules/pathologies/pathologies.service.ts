import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { nextPathologyCode } from '../../common/utils/zone-scoped-code.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertPathologyElementZone,
  assertPathologyObservationZone,
  requireElement,
  requireObservation,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { PATHOLOGY_SORT, QueryPathologyDto } from './dto/query-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';

@Injectable()
export class PathologiesService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryPathologyDto): Prisma.PathologyOrderByWithRelationInput {
    const field =
      q.sortBy && PATHOLOGY_SORT.includes(q.sortBy as (typeof PATHOLOGY_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async validatePathology(
    zoneId: string,
    elementId?: string | null,
    observationId?: string | null,
  ) {
    await requireZone(this.prisma, zoneId);
    if (elementId) {
      const el = await requireElement(this.prisma, elementId);
      assertPathologyElementZone(zoneId, el.zoneId);
    }
    if (observationId) {
      const obs = await requireObservation(this.prisma, observationId);
      assertPathologyObservationZone(zoneId, obs.zoneId);
    }
  }

  async create(dto: CreatePathologyDto) {
    await this.validatePathology(dto.zoneId, dto.elementId, dto.observationId);
    const code = dto.code?.trim() || (await nextPathologyCode(this.prisma, dto.zoneId));
    try {
      return await this.prisma.pathology.create({
        data: {
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          observationId: dto.observationId,
          code,
          name: dto.name.trim(),
          pathologyType: dto.pathologyType,
          severity: dto.severity,
          description: dto.description,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryPathologyDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.PathologyWhereInput = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.elementId) where.elementId = query.elementId;
    if (query.observationId) where.observationId = query.observationId;
    if (query.pathologyType) where.pathologyType = query.pathologyType;
    if (query.severity) where.severity = query.severity;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.pathology.count({ where }),
      this.prisma.pathology.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: { zone: true, element: true, observation: true },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const p = await this.prisma.pathology.findUnique({
      where: { id },
      include: {
        zone: { include: { project: true } },
        element: true,
        observation: true,
        documents: { orderBy: { createdAt: 'desc' }, take: 100 },
        photos: { orderBy: { createdAt: 'desc' }, take: 100 },
        decisions: { take: 30 },
        interventions: { take: 30 },
      },
    });
    if (!p) throw new NotFoundException('Pathology not found');
    return p;
  }

  async update(id: string, dto: UpdatePathologyDto) {
    const existing = await this.findOne(id);
    const zoneId = dto.zoneId ?? existing.zoneId;
    await this.validatePathology(
      zoneId,
      dto.elementId !== undefined ? dto.elementId : existing.elementId,
      dto.observationId !== undefined ? dto.observationId : existing.observationId,
    );
    try {
      return await this.prisma.pathology.update({
        where: { id },
        data: {
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          observationId: dto.observationId,
          code: dto.code,
          name: dto.name,
          pathologyType: dto.pathologyType,
          severity: dto.severity,
          description: dto.description,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression pathologie : CASCADE documents et médias pathologie ; décisions liées : `pathologyId` mis à NULL
   * (pas de suppression des décisions).
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.pathology.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
