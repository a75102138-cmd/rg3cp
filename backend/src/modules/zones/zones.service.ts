import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { requireProject } from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { QueryZoneDto, ZONE_SORT } from './dto/query-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Slug ASCII pour base de code zone (majuscules, tirets), max 40 car. */
  private slugifyZoneCodeBase(name: string): string {
    const raw = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase();
    const base = (raw || 'ZONE').replace(/-+/g, '-').slice(0, 40);
    return base || 'ZONE';
  }

  /** Code unique @@unique([projectId, code]) — dérivé du nom avec suffixe si collision. */
  private async generateUniqueZoneCode(projectId: string, name: string): Promise<string> {
    const base = this.slugifyZoneCodeBase(name);
    for (let i = 0; i < 200; i++) {
      const suffix = i === 0 ? '' : `-${i + 1}`;
      const code = `${base}${suffix}`.slice(0, 64);
      const exists = await this.prisma.zone.findFirst({
        where: { projectId, code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    const fallback = `Z-${Date.now().toString(36).toUpperCase()}`.slice(0, 64);
    return fallback;
  }

  private orderBy(q: QueryZoneDto): Prisma.ZoneOrderByWithRelationInput {
    const raw =
      q.sortBy && ZONE_SORT.includes(q.sortBy as (typeof ZONE_SORT)[number])
        ? q.sortBy
        : 'code';
    const field = raw === 'type' ? 'zoneType' : raw;
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir } as Prisma.ZoneOrderByWithRelationInput;
  }

  private async assertParentInProject(projectId: string, parentZoneId?: string | null) {
    if (!parentZoneId) return;
    const parent = await this.prisma.zone.findUnique({ where: { id: parentZoneId } });
    if (!parent) throw new NotFoundException('Parent zone not found');
    if (parent.projectId !== projectId) {
      throw new BadRequestException('Parent zone must belong to the same project');
    }
  }

  async create(dto: CreateZoneDto) {
    await requireProject(this.prisma, dto.projectId);
    await this.assertParentInProject(dto.projectId, dto.parentZoneId);
    const code = await this.generateUniqueZoneCode(dto.projectId, dto.name.trim());
    try {
      return await this.prisma.zone.create({
        data: {
          projectId: dto.projectId,
          parentZoneId: dto.parentZoneId ?? undefined,
          code,
          name: dto.name.trim(),
          zoneType: dto.type,
          heritageSensitivity: dto.heritageSensitivity,
          description: dto.description?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryZoneDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ZoneWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.parentZoneId !== undefined) {
      where.parentZoneId = query.parentZoneId === null ? null : query.parentZoneId;
    }
    if (query.type) where.zoneType = query.type;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.zone.count({ where }),
      this.prisma.zone.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: { project: true, parent: true },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const z = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        project: true,
        parent: true,
        children: { take: 100, orderBy: { code: 'asc' } },
        _count: {
          select: {
            elements: true,
            observations: true,
            documents: true,
            photos: true,
            labTests: true,
            risks: true,
          },
        },
      },
    });
    if (!z) throw new NotFoundException('Zone not found');
    return z;
  }

  async update(id: string, dto: UpdateZoneDto) {
    const existing = await this.findOne(id);
    if (dto.parentZoneId !== undefined) {
      await this.assertParentInProject(existing.projectId, dto.parentZoneId);
    }
    const data: Prisma.ZoneUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.zoneType = dto.type;
    if (dto.heritageSensitivity !== undefined) data.heritageSensitivity = dto.heritageSensitivity;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.parentZoneId !== undefined) data.parentZoneId = dto.parentZoneId;
    try {
      return await this.prisma.zone.update({
        where: { id },
        data,
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression zone : CASCADE (sous-zones, éléments, essais, docs/médias/risques zone,
   * observations, pathologies, décisions, interventions, chaîne inférieure selon schéma).
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.zone.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
