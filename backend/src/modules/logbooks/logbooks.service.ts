import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertBusinessDateRange } from '../../common/utils/business-date.util';
import { resolveDateRangePreset } from '../../common/utils/date-range-preset.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { requireActor, requireProject } from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLogbookDto } from './dto/create-logbook.dto';
import { LOGBOOK_SORT, QueryLogbookDto } from './dto/query-logbook.dto';
import { UpdateLogbookDto } from './dto/update-logbook.dto';

@Injectable()
export class LogbooksService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryLogbookDto): Prisma.LogbookOrderByWithRelationInput {
    const field =
      q.sortBy && LOGBOOK_SORT.includes(q.sortBy as (typeof LOGBOOK_SORT)[number])
        ? q.sortBy
        : 'eventAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private async assertDecisionsInterventionsBelongToProject(
    projectId: string,
    decisionIds?: string[],
    interventionIds?: string[],
  ) {
    if (decisionIds?.length) {
      for (const did of decisionIds) {
        const d = await this.prisma.decision.findUnique({
          where: { id: did },
          include: { zone: true },
        });
        if (!d) throw new NotFoundException(`Decision ${did} not found`);
        if (d.zone.projectId !== projectId) {
          throw new BadRequestException(`Decision ${did} is not in this project`);
        }
      }
    }
    if (interventionIds?.length) {
      for (const iid of interventionIds) {
        const i = await this.prisma.intervention.findUnique({
          where: { id: iid },
          include: { zone: true },
        });
        if (!i) throw new NotFoundException(`Intervention ${iid} not found`);
        if (i.zone.projectId !== projectId) {
          throw new BadRequestException(`Intervention ${iid} is not in this project`);
        }
      }
    }
  }

  private async generateUniqueLogbookCode(projectId: string): Promise<string> {
    const rows = await this.prisma.logbook.findMany({
      where: { projectId },
      select: { code: true },
    });
    let max = 0;
    const re = /^JRN-(\d+)$/i;
    for (const { code } of rows) {
      const m = re.exec(code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `JRN-${String(max + 1).padStart(4, '0')}`;
  }

  private async applyDecisionInterventionSync(
    tx: Prisma.TransactionClient,
    logbookId: string,
    projectId: string,
    dto: Pick<UpdateLogbookDto, 'decisionIds' | 'interventionIds'>,
  ) {
    if (dto.decisionIds !== undefined) {
      await this.assertDecisionsInterventionsBelongToProject(projectId, dto.decisionIds, undefined);
      await tx.logbookDecision.deleteMany({ where: { logbookId } });
      if (dto.decisionIds.length) {
        await tx.logbookDecision.createMany({
          data: dto.decisionIds.map((decisionId) => ({ logbookId, decisionId })),
        });
      }
    }
    if (dto.interventionIds !== undefined) {
      await this.assertDecisionsInterventionsBelongToProject(projectId, undefined, dto.interventionIds);
      await tx.logbookIntervention.deleteMany({ where: { logbookId } });
      if (dto.interventionIds.length) {
        await tx.logbookIntervention.createMany({
          data: dto.interventionIds.map((interventionId) => ({
            logbookId,
            interventionId,
          })),
        });
      }
    }
  }

  async create(dto: CreateLogbookDto) {
    await requireProject(this.prisma, dto.projectId);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    await this.assertDecisionsInterventionsBelongToProject(
      dto.projectId,
      dto.decisionIds,
      dto.interventionIds,
    );
    const eventAt = new Date(dto.eventAt);
    if (Number.isNaN(eventAt.getTime())) {
      throw new BadRequestException('eventAt invalide');
    }
    const code = await this.generateUniqueLogbookCode(dto.projectId);
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const row = await tx.logbook.create({
          data: {
            projectId: dto.projectId,
            code,
            title: dto.title.trim(),
            description: dto.description?.trim() || null,
            authorActorId: dto.authorActorId ?? null,
            authorName: dto.authorName?.trim() || null,
            weather: dto.weather,
            workforce: dto.workforce ?? null,
            eventAt,
          },
        });
        await this.applyDecisionInterventionSync(tx, row.id, dto.projectId, {
          decisionIds: dto.decisionIds ?? [],
          interventionIds: dto.interventionIds ?? [],
        });
        return row;
      });
      return this.findOne(created.id);
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryLogbookDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.LogbookWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.authorName?.length) {
      where.authorName = { contains: query.authorName, mode: 'insensitive' };
    }
    if (query.weather) where.weather = query.weather;
    const presetRange = resolveDateRangePreset(query.datePreset);
    if (presetRange || query.dateFrom || query.dateTo) {
      where.eventAt = {};
      if (presetRange) {
        where.eventAt.gte = presetRange.from;
        where.eventAt.lte = presetRange.to;
      } else {
        if (query.dateFrom) where.eventAt.gte = new Date(query.dateFrom);
        if (query.dateTo) where.eventAt.lte = new Date(query.dateTo);
      }
    }
    if (query.search?.length) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.logbook.count({ where }),
      this.prisma.logbook.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          project: true,
          authorActor: true,
          _count: {
            select: {
              decisionLinks: true,
              interventionLinks: true,
            },
          },
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const l = await this.prisma.logbook.findUnique({
      where: { id },
      include: {
        project: true,
        authorActor: true,
        decisionLinks: { include: { decision: true } },
        interventionLinks: { include: { intervention: true } },
      },
    });
    if (!l) throw new NotFoundException('Logbook not found');
    return l;
  }

  async update(id: string, dto: UpdateLogbookDto) {
    const existing = await this.findOne(id);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    const projectId = existing.projectId;
    await this.assertDecisionsInterventionsBelongToProject(
      projectId,
      dto.decisionIds,
      dto.interventionIds,
    );
    let eventAt: Date | undefined;
    if (dto.eventAt !== undefined) {
      eventAt = new Date(dto.eventAt);
      if (Number.isNaN(eventAt.getTime())) {
        throw new BadRequestException('eventAt invalide');
      }
      assertBusinessDateRange(eventAt);
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.logbook.update({
          where: { id },
          data: {
            title: dto.title !== undefined ? dto.title.trim() : undefined,
            description:
              dto.description !== undefined ? dto.description?.trim() || null : undefined,
            authorActorId: dto.authorActorId !== undefined ? dto.authorActorId : undefined,
            authorName: dto.authorName !== undefined ? dto.authorName?.trim() || null : undefined,
            weather: dto.weather,
            workforce: dto.workforce !== undefined ? dto.workforce : undefined,
            eventAt,
          },
        });
        await this.applyDecisionInterventionSync(tx, id, projectId, {
          decisionIds: dto.decisionIds,
          interventionIds: dto.interventionIds,
        });
      });
      return this.findOne(id);
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.logbook.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
