import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { PrismaService } from '../../prisma/prisma.service';
import { MATERIAL_SORT, QueryMaterialDto } from './dto/query-material.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextCode(): Promise<string> {
    const count = await this.prisma.material.count();
    let n = count + 1;
    for (let i = 0; i < 2000; i++) {
      const code = `MAT-${String(n).padStart(3, '0')}`;
      const exists = await this.prisma.material.findFirst({ where: { code }, select: { id: true } });
      if (!exists) return code;
      n += 1;
    }
    return `MAT-${Date.now().toString(36).toUpperCase()}`;
  }

  private orderBy(q: QueryMaterialDto): Prisma.MaterialOrderByWithRelationInput {
    const field =
      q.sortBy && MATERIAL_SORT.includes(q.sortBy as (typeof MATERIAL_SORT)[number])
        ? q.sortBy
        : 'name';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  async create(dto: CreateMaterialDto) {
    try {
      return await this.prisma.material.create({
        data: {
          code: await this.nextCode(),
          name: dto.name.trim(),
          type: dto.type,
          origin: dto.origin?.trim() || null,
          compatibility: dto.compatibility?.trim() || null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryMaterialDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.MaterialWhereInput = {};
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { origin: { contains: query.search, mode: 'insensitive' } },
        { compatibility: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.material.count({ where }),
      this.prisma.material.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const m = await this.prisma.material.findUnique({
      where: { id },
      include: { _count: { select: { labTests: true, elements: true } } },
    });
    if (!m) throw new NotFoundException('Material not found');
    return m;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    try {
      return await this.prisma.material.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.origin !== undefined ? { origin: dto.origin?.trim() || null } : {}),
          ...(dto.compatibility !== undefined
            ? { compatibility: dto.compatibility?.trim() || null }
            : {}),
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.material.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
