import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActorDto } from './dto/create-actor.dto';
import { QueryActorDto } from './dto/query-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Injectable()
export class ActorsService {
  constructor(private readonly prisma: PrismaService) {}

  private uniqueIds(ids: string[]): string[] {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
  }

  private async nextCode(): Promise<string> {
    const count = await this.prisma.actor.count();
    let n = count + 1;
    for (let i = 0; i < 2000; i++) {
      const code = `ACT-${String(n).padStart(3, '0')}`;
      const exists = await this.prisma.actor.findFirst({ where: { code }, select: { id: true } });
      if (!exists) return code;
      n += 1;
    }
    return `ACT-${Date.now().toString(36).toUpperCase()}`;
  }

  private orderBy(q: QueryActorDto): Prisma.ActorOrderByWithRelationInput {
    const field = q.sortBy ?? 'name';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  async create(dto: CreateActorDto) {
    try {
      return await this.prisma.actor.create({
        data: {
          code: await this.nextCode(),
          name: dto.name.trim(),
          organization: dto.organization?.trim() || null,
          role: dto.role,
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
        },
        include: {
          projectAssignments: {
            select: { projectId: true },
          },
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryActorDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ActorWhereInput = {};
    if (query.search?.trim()) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { organization: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.organization?.trim()) {
      where.organization = { contains: query.organization.trim(), mode: 'insensitive' };
    }
    if (query.role) {
      where.role = query.role;
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.actor.count({ where }),
      this.prisma.actor.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          projectAssignments: {
            select: { projectId: true },
          },
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const actor = await this.prisma.actor.findUnique({
      where: { id },
      include: {
        projectAssignments: {
          select: { projectId: true },
        },
      },
    });
    if (!actor) throw new NotFoundException('Actor not found');
    return actor;
  }

  async update(id: string, dto: UpdateActorDto) {
    await this.findOne(id);
    try {
      return await this.prisma.actor.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.organization !== undefined ? { organization: dto.organization?.trim() || null } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        },
        include: {
          projectAssignments: {
            select: { projectId: true },
          },
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.actor.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }

  async findAssignedProjects(id: string) {
    await this.findOne(id);
    const rows = await this.prisma.projectActorAssignment.findMany({
      where: { actorId: id },
      select: {
        projectId: true,
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => row.project);
  }

  async updateAssignedProjects(id: string, projectIds: string[]) {
    await this.findOne(id);
    const uniqueProjectIds = this.uniqueIds(projectIds);
    const prevProjects = await this.findAssignedProjects(id);
    const prevProjectIds = prevProjects.map((p) => p.id);

    const actor = await this.prisma.actor.findUnique({
      where: { id },
      select: { email: true },
    });

    // Bridge actor -> user mapping for validator permissions:
    // We treat the user account having the same email (and role ACTEUR) as the validator account.
    const targetUserIds =
      actor?.email?.trim()
        ? (
            await this.prisma.user.findMany({
              where: { email: actor.email.trim(), role: 'ACTEUR' as any },
              select: { id: true },
            })
          ).map((u) => u.id)
        : [];

    if (uniqueProjectIds.length) {
      const totalProjects = await this.prisma.project.count({
        where: { id: { in: uniqueProjectIds } },
      });
      if (totalProjects !== uniqueProjectIds.length) {
        throw new NotFoundException('Au moins un projet assigné est introuvable');
      }
    }
    await this.prisma.$transaction([
      this.prisma.projectActorAssignment.deleteMany({ where: { actorId: id } }),
      ...(uniqueProjectIds.length
        ? [
            this.prisma.projectActorAssignment.createMany({
              data: uniqueProjectIds.map((projectId) => ({ actorId: id, projectId })),
            }),
          ]
        : []),
      ...(targetUserIds.length && prevProjectIds.length
        ? [
            this.prisma.projectUserAssignment.deleteMany({
              where: {
                projectId: { in: prevProjectIds },
                userId: { in: targetUserIds },
              },
            }),
          ]
        : []),
      ...(targetUserIds.length && uniqueProjectIds.length
        ? [
            this.prisma.projectUserAssignment.createMany({
              data: uniqueProjectIds.flatMap((projectId) =>
                targetUserIds.map((userId) => ({ projectId, userId })),
              ),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
    return this.findAssignedProjects(id);
  }
}
