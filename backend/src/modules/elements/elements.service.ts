import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { nextElementCode } from '../../common/utils/zone-scoped-code.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { requireMaterial, requireZone } from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateElementDto } from './dto/create-element.dto';
import { ELEMENT_SORT, QueryElementDto } from './dto/query-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

@Injectable()
export class ElementsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderBy(q: QueryElementDto): Prisma.ElementOrderByWithRelationInput {
    const field =
      q.sortBy && ELEMENT_SORT.includes(q.sortBy as (typeof ELEMENT_SORT)[number])
        ? q.sortBy
        : 'code';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  async create(dto: CreateElementDto) {
    await requireZone(this.prisma, dto.zoneId);
    await requireMaterial(this.prisma, dto.materialId);
    const code = dto.code?.trim() || (await nextElementCode(this.prisma, dto.zoneId));
    try {
      return await this.prisma.element.create({
        data: {
          zoneId: dto.zoneId,
          code,
          name: dto.name,
          elementType: dto.elementType,
          materialId: dto.materialId,
          description: dto.description,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryElementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ElementWhereInput = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.projectId) where.zone = { projectId: query.projectId };
    if (query.elementType) where.elementType = query.elementType;
    if (query.search?.length) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { material: { name: { contains: query.search, mode: 'insensitive' } } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.element.count({ where }),
      this.prisma.element.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: { zone: true, material: true },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const e = await this.prisma.element.findUnique({
      where: { id },
      include: {
        zone: { include: { project: true } },
        material: true,
        photos: { take: 48, orderBy: { createdAt: 'desc' } },
        _count: { select: { observations: true, photos: true } },
      },
    });
    if (!e) throw new NotFoundException('Element not found');
    return e;
  }

  async update(id: string, dto: UpdateElementDto) {
    await this.findOne(id);
    const data: Prisma.ElementUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code.trim();
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.elementType !== undefined) data.elementType = dto.elementType;
    if (dto.materialId !== undefined) {
      if (dto.materialId) await requireMaterial(this.prisma, dto.materialId);
      data.material = dto.materialId
        ? { connect: { id: dto.materialId } }
        : { disconnect: true };
    }
    if (dto.description !== undefined) data.description = dto.description;
    try {
      return await this.prisma.element.update({ where: { id }, data });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Suppression élément : CASCADE sur observations rattachées à l’élément et médias élément ;
   * matériau catalogue : non supprimé (SET NULL).
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.element.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
