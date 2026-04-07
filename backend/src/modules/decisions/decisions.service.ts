import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { nextDecisionCode } from '../../common/utils/zone-scoped-code.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertDecisionObservationZone,
  assertDecisionPathologyZone,
  requireDocument,
  requireObservation,
  requirePathology,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { DECISION_SORT, QueryDecisionDto } from './dto/query-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Injectable()
export class DecisionsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryDecisionDto): Prisma.DecisionOrderByWithRelationInput {
    const field =
      q.sortBy && DECISION_SORT.includes(q.sortBy as (typeof DECISION_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async validateDecision(
    zoneId: string,
    observationId?: string | null,
    pathologyId?: string | null,
    pvDocumentId?: string | null,
  ) {
    await requireZone(this.prisma, zoneId);
    if (observationId) {
      const o = await requireObservation(this.prisma, observationId);
      assertDecisionObservationZone(zoneId, o.zoneId);
    }
    if (pathologyId) {
      const p = await requirePathology(this.prisma, pathologyId);
      assertDecisionPathologyZone(zoneId, p.zoneId);
    }
    if (pvDocumentId) await requireDocument(this.prisma, pvDocumentId);
  }

  async create(dto: CreateDecisionDto) {
    await this.validateDecision(
      dto.zoneId,
      dto.observationId,
      dto.pathologyId,
      dto.pvDocumentId,
    );
    const code = dto.code?.trim() || (await nextDecisionCode(this.prisma, dto.zoneId));
    try {
      return await this.prisma.decision.create({
        data: {
          zoneId: dto.zoneId,
          observationId: dto.observationId,
          pathologyId: dto.pathologyId,
          authorName: dto.authorName?.trim() || undefined,
          pvDocumentId: dto.pvDocumentId,
          code,
          title: dto.title,
          decisionType: dto.decisionType,
          status: dto.status,
          description: dto.description,
          justification: dto.justification,
          doctrinalPrinciples: dto.doctrinalPrinciples?.join(' | '),
          decidedAt: new Date(),
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryDecisionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.DecisionWhereInput = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.observationId) where.observationId = query.observationId;
    if (query.pathologyId) where.pathologyId = query.pathologyId;
    if (query.authorName?.length) {
      where.authorName = { contains: query.authorName, mode: 'insensitive' };
    }
    if (query.decisionType) where.decisionType = query.decisionType;
    if (query.status) where.status = query.status;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { authorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.decision.count({ where }),
      this.prisma.decision.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          zone: true,
          observation: true,
          pathology: true,
          pvDocument: true,
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const d = await this.prisma.decision.findUnique({
      where: { id },
      include: {
        zone: { include: { project: true } },
        observation: { include: { element: true } },
        pathology: true,
        pvDocument: true,
        documents: { orderBy: { createdAt: 'desc' }, take: 100 },
        interventions: { orderBy: { createdAt: 'desc' }, take: 100 },
        risks: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!d) throw new NotFoundException('Decision not found');
    return d;
  }

  async update(id: string, dto: UpdateDecisionDto) {
    const existing = await this.findOne(id);
    const zoneId = dto.zoneId ?? existing.zoneId;
    await this.validateDecision(
      zoneId,
      dto.observationId !== undefined ? dto.observationId : existing.observationId,
      dto.pathologyId !== undefined ? dto.pathologyId : existing.pathologyId,
      dto.pvDocumentId !== undefined ? dto.pvDocumentId : existing.pvDocumentId,
    );
    try {
      return await this.prisma.decision.update({
        where: { id },
        data: {
          zoneId: dto.zoneId,
          observationId: dto.observationId,
          pathologyId: dto.pathologyId,
          authorName: dto.authorName !== undefined ? dto.authorName?.trim() || null : undefined,
          pvDocumentId: dto.pvDocumentId,
          code: dto.code,
          title: dto.title,
          decisionType: dto.decisionType,
          status: dto.status,
          description: dto.description,
          justification: dto.justification,
          doctrinalPrinciples:
            dto.doctrinalPrinciples !== undefined ? dto.doctrinalPrinciples.join(' | ') : undefined,
          decidedAt:
            dto.decidedAt !== undefined
              ? dto.decidedAt
                ? new Date(dto.decidedAt)
                : null
              : undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression d’une décision : en base, documents / risques / interventions liés sont en CASCADE.
   * Le document PV (lié par `pvDocumentId`, sans `decisionId` sur le document) est supprimé explicitement.
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.$transaction(async (tx) => {
        const dec = await tx.decision.findUnique({
          where: { id },
          select: { pvDocumentId: true },
        });
        const pvId = dec?.pvDocumentId;
        if (pvId) {
          await tx.decision.update({
            where: { id },
            data: { pvDocumentId: null },
          });
          await tx.document.delete({ where: { id: pvId } });
        }
        await tx.decision.delete({ where: { id } });
      });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
