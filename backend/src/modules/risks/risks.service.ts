import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Risk } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { assertRiskHasScope } from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { QueryRiskDto, RISK_SORT } from './dto/query-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

@Injectable()
export class RisksService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryRiskDto): Prisma.RiskOrderByWithRelationInput {
    const field =
      q.sortBy && RISK_SORT.includes(q.sortBy as (typeof RISK_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private mergeScope(existing: Risk, dto: UpdateRiskDto) {
    return {
      projectId: dto.projectId !== undefined ? dto.projectId : existing.projectId,
      zoneId: dto.zoneId !== undefined ? dto.zoneId : existing.zoneId,
      decisionId: dto.decisionId !== undefined ? dto.decisionId : existing.decisionId,
      interventionId: dto.interventionId !== undefined ? dto.interventionId : existing.interventionId,
    };
  }

  /** Ensures optional zone / decision references are consistent with the project (when set). */
  private async assertRiskProjectRelations(
    projectId: string | null | undefined,
    zoneId: string | null | undefined,
    decisionId: string | null | undefined,
  ) {
    if (zoneId) {
      const z = await this.prisma.zone.findUnique({ where: { id: zoneId } });
      if (!z) throw new NotFoundException('Zone not found');
      if (projectId && z.projectId !== projectId) {
        throw new BadRequestException('Zone does not belong to the selected project');
      }
    }
    if (decisionId) {
      const d = await this.prisma.decision.findUnique({
        where: { id: decisionId },
        include: { zone: true },
      });
      if (!d) throw new NotFoundException('Decision not found');
      if (projectId && d.zone.projectId !== projectId) {
        throw new BadRequestException('Decision does not belong to the selected project');
      }
      if (zoneId && d.zoneId !== zoneId) {
        throw new BadRequestException('Decision does not match the selected zone');
      }
    }
  }

  private async assertInterventionRiskRelations(
    interventionId: string | null | undefined,
    projectId: string | null | undefined,
    zoneId: string | null | undefined,
    decisionId: string | null | undefined,
  ) {
    if (!interventionId) return;
    const inv = await this.prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { zone: true },
    });
    if (!inv) throw new NotFoundException('Intervention not found');
    if (zoneId && inv.zoneId !== zoneId) {
      throw new BadRequestException('Zone does not match intervention');
    }
    if (projectId && inv.zone.projectId !== projectId) {
      throw new BadRequestException('Project does not match intervention');
    }
    if (decisionId && inv.decisionId !== decisionId) {
      throw new BadRequestException('Decision does not match intervention');
    }
  }

  async create(dto: CreateRiskDto) {
    assertRiskHasScope(dto);
    await this.assertRiskProjectRelations(dto.projectId, dto.zoneId, dto.decisionId);
    await this.assertInterventionRiskRelations(
      dto.interventionId,
      dto.projectId,
      dto.zoneId,
      dto.decisionId,
    );
    try {
      return await this.prisma.risk.create({
        data: {
          ...dto,
          ownerName: dto.ownerName?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryRiskDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.RiskWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.decisionId) where.decisionId = query.decisionId;
    if (query.interventionId) where.interventionId = query.interventionId;
    if (query.ownerName?.length) {
      where.ownerName = { contains: query.ownerName, mode: 'insensitive' };
    }
    if (query.status) where.status = query.status;
    if (query.riskCategory) where.riskCategory = query.riskCategory;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { mitigation: { contains: query.search, mode: 'insensitive' } },
        { ownerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.risk.count({ where }),
      this.prisma.risk.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          project: true,
          zone: true,
          decision: true,
          intervention: true,
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const r = await this.prisma.risk.findUnique({
      where: { id },
      include: {
        project: true,
        zone: true,
        decision: true,
        intervention: true,
      },
    });
    if (!r) throw new NotFoundException('Risk not found');
    return r;
  }

  async update(id: string, dto: UpdateRiskDto) {
    const existing = await this.prisma.risk.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Risk not found');
    const merged = this.mergeScope(existing, dto);
    assertRiskHasScope(merged);
    await this.assertRiskProjectRelations(merged.projectId, merged.zoneId, merged.decisionId);
    await this.assertInterventionRiskRelations(
      merged.interventionId,
      merged.projectId,
      merged.zoneId,
      merged.decisionId,
    );
    try {
      const { ownerName, ...rest } = dto;
      return await this.prisma.risk.update({
        where: { id },
        data: {
          ...rest,
          ...(ownerName !== undefined ? { ownerName: ownerName?.trim() || null } : {}),
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.risk.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
