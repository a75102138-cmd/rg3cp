import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryPathBuilderService } from '../cloudinary/cloudinary-path-builder.service';
import { CloudinaryUploadService } from '../cloudinary/cloudinary-upload.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { PROJECT_SORT, QueryProjectDto } from './dto/query-project.dto';
import { UpdateProjectAssignmentsDto } from './dto/update-project-assignments.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryPaths: CloudinaryPathBuilderService,
    private readonly cloudinaryUpload: CloudinaryUploadService,
  ) {}

  private orderBy(q: QueryProjectDto): Prisma.ProjectOrderByWithRelationInput {
    const field =
      q.sortBy && PROJECT_SORT.includes(q.sortBy as (typeof PROJECT_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private parseDates(dto: { startDate?: string; plannedEndDate?: string }) {
    return {
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
    };
  }

  private uniqueIds(ids: string[] | undefined): string[] {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
  }

  /** Next sequential code PRJ-0001, PRJ-0002, … among existing codes matching /^PRJ-\d+$/i */
  private async generateNextProjectCode(): Promise<string> {
    const rows = await this.prisma.project.findMany({ select: { code: true } });
    let max = 0;
    const re = /^PRJ-(\d+)$/i;
    for (const { code } of rows) {
      const m = re.exec(code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `PRJ-${String(max + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateProjectDto) {
    const dates = this.parseDates(dto);
    if (!dates.startDate || Number.isNaN(dates.startDate.getTime())) {
      throw new BadRequestException('startDate invalide');
    }
    const dataBase = {
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      location: dto.location.trim(),
      imageUrl:
        dto.imageUrl !== undefined && dto.imageUrl !== null && String(dto.imageUrl).trim() !== ''
          ? String(dto.imageUrl).trim()
          : undefined,
      status: dto.status,
      startDate: dates.startDate,
      plannedEndDate: dates.plannedEndDate,
    };
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = await this.generateNextProjectCode();
      try {
        return await this.prisma.project.create({
          data: { code, ...dataBase },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const targets = e.meta?.target;
          const t = Array.isArray(targets) ? targets.join(',') : String(targets ?? '');
          if (t.includes('code')) continue;
        }
        handlePrismaError(e);
      }
    }
    throw new ConflictException('Impossible d’attribuer un code projet unique');
  }

  async findAll(query: QueryProjectDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ProjectWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.length) {
      const s = query.search;
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          _count: {
            select: {
              zones: true,
              logbooks: true,
              documents: true,
              photos: true,
              risks: true,
              userAssignments: true,
              actorAssignments: true,
            },
          },
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  /**
   * Couverture projet → Cloudinary `rg3cp/{projectCode}/cover`, puis `imageUrl` = secure URL.
   */
  async uploadCover(projectId: string, file: Express.Multer.File | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Seules les images sont acceptées pour la couverture.');
    }
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projet introuvable');
    const folder = this.cloudinaryPaths.projectCoverFolderRg3cp(project.code);
    try {
      const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
      const imageUrl = up.secure_url?.trim() || up.url?.trim();
      if (!imageUrl) {
        throw new BadRequestException('Réponse Cloudinary invalide');
      }
      return await this.prisma.project.update({
        where: { id: projectId },
        data: { imageUrl },
      });
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError) handlePrismaError(e);
      throw new BadRequestException('Échec de l’envoi de l’image de couverture.');
    }
  }

  async findOne(id: string) {
    const p = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            zones: true,
            logbooks: true,
            documents: true,
            photos: true,
            risks: true,
            userAssignments: true,
            actorAssignments: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    const dates = this.parseDates(dto);
    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.startDate !== undefined) {
      const d = dates.startDate;
      if (!d || Number.isNaN(d.getTime())) {
        throw new BadRequestException('startDate invalide');
      }
      data.startDate = d;
    }
    if (dto.plannedEndDate !== undefined) {
      data.plannedEndDate = dates.plannedEndDate ?? null;
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl =
        dto.imageUrl && String(dto.imageUrl).trim() !== '' ? String(dto.imageUrl).trim() : null;
    }
    try {
      return await this.prisma.project.update({
        where: { id },
        data,
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAssignments(id: string) {
    await this.findOne(id);
    return this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        userAssignments: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        actorAssignments: {
          select: {
            actorId: true,
            actor: {
              select: {
                id: true,
                code: true,
                name: true,
                organization: true,
                role: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateAssignments(id: string, dto: UpdateProjectAssignmentsDto) {
    await this.findOne(id);
    const userIds = this.uniqueIds(dto.userIds);
    const actorIds = this.uniqueIds(dto.actorIds);

    if (userIds.length) {
      const existingUsers = await this.prisma.user.count({ where: { id: { in: userIds } } });
      if (existingUsers !== userIds.length) {
        throw new BadRequestException('Au moins un utilisateur assigné est introuvable');
      }
    }
    if (actorIds.length) {
      const existingActors = await this.prisma.actor.count({ where: { id: { in: actorIds } } });
      if (existingActors !== actorIds.length) {
        throw new BadRequestException('Au moins un acteur assigné est introuvable');
      }
    }

    await this.prisma.$transaction([
      this.prisma.projectUserAssignment.deleteMany({ where: { projectId: id } }),
      this.prisma.projectActorAssignment.deleteMany({ where: { projectId: id } }),
      ...(userIds.length
        ? [
            this.prisma.projectUserAssignment.createMany({
              data: userIds.map((userId) => ({ projectId: id, userId })),
            }),
          ]
        : []),
      ...(actorIds.length
        ? [
            this.prisma.projectActorAssignment.createMany({
              data: actorIds.map((actorId) => ({ projectId: id, actorId })),
            }),
          ]
        : []),
    ]);

    return this.findAssignments(id);
  }

  /**
   * Suppression projet : CASCADE côté schéma (zones, journal, documents/photos/risques projet,
   * puis toute la hiérarchie zone → …). Acteurs référencés : SET NULL.
   */
  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
