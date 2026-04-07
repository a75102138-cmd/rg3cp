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
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const actor = await this.prisma.actor.findUnique({ where: { id } });
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
}
