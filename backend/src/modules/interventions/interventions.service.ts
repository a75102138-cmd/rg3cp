import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  parseBusinessDateString,
  parseOptionalBusinessDateString,
} from '../../common/utils/business-date.util';
import { resolveDateRangePreset } from '../../common/utils/date-range-preset.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertInterventionDecisionZone,
  assertInterventionElementZone,
  assertInterventionPathologyZone,
  requireDecision,
  requireElement,
  requireActor,
  requirePathology,
  requireZone,
} from '../../common/validation/domain-validation';
import { nextInterventionCode } from '../../common/utils/zone-scoped-code.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { INTERVENTION_SORT, QueryInterventionDto } from './dto/query-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';

@Injectable()
export class InterventionsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryInterventionDto): Prisma.InterventionOrderByWithRelationInput {
    const field =
      q.sortBy &&
      INTERVENTION_SORT.includes(q.sortBy as (typeof INTERVENTION_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async validateIntervention(dto: {
    decisionId: string;
    zoneId: string;
    elementId?: string | null;
    pathologyId?: string | null;
  }) {
    const decision = await requireDecision(this.prisma, dto.decisionId);
    await requireZone(this.prisma, dto.zoneId);
    assertInterventionDecisionZone(decision.zoneId, dto.zoneId);
    if (dto.elementId) {
      const el = await requireElement(this.prisma, dto.elementId);
      assertInterventionElementZone(dto.zoneId, el.zoneId);
    }
    if (dto.pathologyId) {
      const p = await requirePathology(this.prisma, dto.pathologyId);
      assertInterventionPathologyZone(dto.zoneId, p.zoneId);
    }
  }

  async create(dto: CreateInterventionDto) {
    await this.validateIntervention(dto);
    if (dto.companyActorId) await requireActor(this.prisma, dto.companyActorId);
    const code = dto.code?.trim() || (await nextInterventionCode(this.prisma, dto.decisionId));
    try {
      return await this.prisma.intervention.create({
        data: {
          decisionId: dto.decisionId,
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          pathologyId: dto.pathologyId,
          companyActorId: dto.companyActorId,
          companyName: dto.companyName?.trim() || undefined,
          code,
          interventionType: dto.interventionType,
          status: dto.status,
          description: dto.description,
          plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
          plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
          eventDate: parseOptionalBusinessDateString(dto.eventDate),
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryInterventionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    let where: Prisma.InterventionWhereInput = {};
    if (query.decisionId) where.decisionId = query.decisionId;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.elementId) where.elementId = query.elementId;
    if (query.pathologyId) where.pathologyId = query.pathologyId;
    if (query.companyName?.length) {
      where.companyName = { contains: query.companyName, mode: 'insensitive' };
    }
    if (query.interventionType) where.interventionType = query.interventionType;
    if (query.status) where.status = query.status;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const presetRange = resolveDateRangePreset(query.datePreset);
    if (presetRange || query.dateFrom || query.dateTo) {
      const from =
        presetRange?.from ??
        (query.dateFrom ? new Date(query.dateFrom) : new Date(0));
      const to =
        presetRange?.to ??
        (query.dateTo ? new Date(query.dateTo) : new Date(8640000000000000));
      const dateWhere: Prisma.InterventionWhereInput = {
        OR: [
          {
            AND: [
              { eventDate: { not: null } },
              { eventDate: { gte: from, lte: to } },
            ],
          },
          {
            AND: [{ eventDate: null }, { createdAt: { gte: from, lte: to } }],
          },
        ],
      };
      where = { AND: [where, dateWhere] };
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.intervention.count({ where }),
      this.prisma.intervention.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          decision: { include: { pvDocument: true } },
          zone: true,
          element: true,
          pathology: true,
          companyActor: true,
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const i = await this.prisma.intervention.findUnique({
      where: { id },
      include: {
        decision: {
          include: {
            pvDocument: true,
            zone: { include: { project: true } },
            observation: { include: { element: true } },
            pathology: true,
          },
        },
        zone: { include: { project: true } },
        element: true,
        pathology: true,
        companyActor: true,
        documents: {
          orderBy: [
            { documentDate: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
          ],
          take: 100,
        },
        photos: {
          orderBy: [
            { takenAt: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
          ],
          take: 100,
        },
        risks: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!i) throw new NotFoundException('Intervention not found');
    return i;
  }

  async update(id: string, dto: UpdateInterventionDto) {
    const existing = await this.findOne(id);
    const decisionId = dto.decisionId ?? existing.decisionId;
    const zoneId = dto.zoneId ?? existing.zoneId;
    await this.validateIntervention({
      decisionId,
      zoneId,
      elementId: dto.elementId !== undefined ? dto.elementId : existing.elementId,
      pathologyId: dto.pathologyId !== undefined ? dto.pathologyId : existing.pathologyId,
    });
    if (dto.companyActorId) await requireActor(this.prisma, dto.companyActorId);
    try {
      return await this.prisma.intervention.update({
        where: { id },
        data: {
          decisionId: dto.decisionId,
          zoneId: dto.zoneId,
          elementId: dto.elementId,
          pathologyId: dto.pathologyId,
          companyActorId: dto.companyActorId,
          companyName: dto.companyName !== undefined ? dto.companyName?.trim() || null : undefined,
          code: dto.code,
          interventionType: dto.interventionType,
          status: dto.status,
          description: dto.description,
          plannedStart:
            dto.plannedStart !== undefined
              ? dto.plannedStart
                ? new Date(dto.plannedStart)
                : null
              : undefined,
          plannedEnd:
            dto.plannedEnd !== undefined
              ? dto.plannedEnd
                ? new Date(dto.plannedEnd)
                : null
              : undefined,
          eventDate:
            dto.eventDate !== undefined
              ? dto.eventDate
                ? parseBusinessDateString(dto.eventDate)
                : null
              : undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression intervention : CASCADE documents, médias et risques liés à l’intervention.
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.intervention.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
