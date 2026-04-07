import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { nextObservationCode } from '../../common/utils/zone-scoped-code.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertObservationElementZone,
  requireElement,
  requireActor,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { OBSERVATION_SORT, QueryObservationDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryObservationDto): Prisma.ObservationOrderByWithRelationInput {
    const field =
      q.sortBy && OBSERVATION_SORT.includes(q.sortBy as (typeof OBSERVATION_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async validateObservationLinks(zoneId: string, elementId?: string | null) {
    await requireZone(this.prisma, zoneId);
    if (elementId) {
      const el = await requireElement(this.prisma, elementId);
      assertObservationElementZone(zoneId, el.zoneId);
    }
  }

  async create(dto: CreateObservationDto) {
    await this.validateObservationLinks(dto.zoneId, dto.elementId);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    const code = dto.code?.trim() || (await nextObservationCode(this.prisma, dto.zoneId));
    try {
      return await this.prisma.observation.create({
        data: {
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          authorActorId: dto.authorActorId,
          authorName: dto.authorName?.trim() || undefined,
          code,
          title: dto.title,
          observationType: dto.observationType,
          severity: dto.severity,
          description: dto.description,
          // Date d'observation fixée automatiquement à la création.
          observedAt: new Date(),
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryObservationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ObservationWhereInput = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.elementId) where.elementId = query.elementId;
    if (query.authorName?.length) {
      where.authorName = { contains: query.authorName, mode: 'insensitive' };
    }
    if (query.observationType) where.observationType = query.observationType;
    if (query.severity) where.severity = query.severity;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { authorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.observation.count({ where }),
      this.prisma.observation.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: { zone: true, element: true },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const o = await this.prisma.observation.findUnique({
      where: { id },
      include: {
        zone: { include: { project: true } },
        element: true,
        authorActor: true,
        pathologies: true,
        decisions: { take: 50 },
        documents: { take: 30 },
        photos: { take: 30 },
      },
    });
    if (!o) throw new NotFoundException('Observation not found');
    return o;
  }

  async update(id: string, dto: UpdateObservationDto) {
    const existing = await this.findOne(id);
    const zoneId = dto.zoneId ?? existing.zoneId;
    const nextElementId = dto.elementId !== undefined ? dto.elementId : existing.elementId;
    await this.validateObservationLinks(zoneId, nextElementId);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      return await this.prisma.observation.update({
        where: { id },
        data: {
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          authorActorId: dto.authorActorId,
          authorName: dto.authorName !== undefined ? dto.authorName?.trim() || null : undefined,
          code: dto.code,
          title: dto.title,
          observationType: dto.observationType,
          severity: dto.severity,
          description: dto.description,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression observation : CASCADE pathologies rattachées, docs/médias observation,
   * décisions liées à cette observation ; pathologie→décision reste géré par SET NULL côté décision si pathologie seule supprimée.
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.observation.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
