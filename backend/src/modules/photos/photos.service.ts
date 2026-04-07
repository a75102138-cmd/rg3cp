import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FileKind, Photo, Prisma } from '@prisma/client';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertPhotoHasContext,
  requireActor,
  requireProject,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryPathBuilderService } from '../cloudinary/cloudinary-path-builder.service';
import { CloudinaryUploadService } from '../cloudinary/cloudinary-upload.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PHOTO_SORT, QueryPhotoDto } from './dto/query-photo.dto';
import { UploadProjectPhotosBodyDto } from './dto/upload-project-photos.dto';
import { UploadObservationPhotosBodyDto } from './dto/upload-observation-photos.dto';
import { UploadInterventionPhotosBodyDto } from './dto/upload-intervention-photos.dto';
import { UploadPathologyPhotosBodyDto } from './dto/upload-pathology-photos.dto';
import { UploadZonePhotosBodyDto } from './dto/upload-zone-photos.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    readonly cloudinaryPaths: CloudinaryPathBuilderService,
    private readonly cloudinaryUpload: CloudinaryUploadService,
  ) {}

  private orderBy(q: QueryPhotoDto): Prisma.PhotoOrderByWithRelationInput {
    const field =
      q.sortBy && PHOTO_SORT.includes(q.sortBy as (typeof PHOTO_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
  }

  private mergeContext(existing: Photo, dto: UpdatePhotoDto) {
    return {
      projectId: dto.projectId !== undefined ? dto.projectId : existing.projectId,
      zoneId: dto.zoneId !== undefined ? dto.zoneId : existing.zoneId,
      elementId: dto.elementId !== undefined ? dto.elementId : existing.elementId,
      observationId: dto.observationId !== undefined ? dto.observationId : existing.observationId,
      pathologyId: dto.pathologyId !== undefined ? dto.pathologyId : existing.pathologyId,
      interventionId: dto.interventionId !== undefined ? dto.interventionId : existing.interventionId,
      logbookId: dto.logbookId !== undefined ? dto.logbookId : existing.logbookId,
    };
  }

  async create(dto: CreatePhotoDto) {
    assertPhotoHasContext(dto);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      return await this.prisma.photo.create({
        data: {
          ...dto,
          fileKind: dto.fileKind ?? FileKind.PHOTO,
          authorName: dto.authorName?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Upload images vers Cloudinary (projects/{code}/journal/photos) et crée les Photo liées au projet + journal.
   */
  async uploadJournalPhotos(
    files: Express.Multer.File[],
    projectId: string,
    logbookId: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const project = await requireProject(this.prisma, projectId);
    const logbook = await this.prisma.logbook.findUnique({ where: { id: logbookId } });
    if (!logbook) throw new NotFoundException('Journal introuvable');
    if (logbook.projectId !== projectId) {
      throw new BadRequestException('Le journal ne correspond pas à ce projet.');
    }
    const folder = this.cloudinaryPaths.projectJournalPhotosFolder(project.code);
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const row = await this.prisma.photo.create({
          data: {
            projectId,
            logbookId,
            fileKind: FileKind.PHOTO,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: up.asset_folder ?? folder,
            bytes: up.bytes,
            format: up.format,
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Upload images → Cloudinary `rg3cp/{code}/photos/{typeSlug}` — photos projet global uniquement. */
  async uploadProjectPhotos(files: Express.Multer.File[], dto: UploadProjectPhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const project = await requireProject(this.prisma, dto.projectId);
    const folder = this.cloudinaryPaths.projectProjectPhotosFolderForType(project.code, dto.photoType);
    const single = files.length === 1;
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const originalFilename = (file.originalname || 'photo').slice(0, 500);
        const title = single && dto.title?.trim()
          ? dto.title.trim().slice(0, 500)
          : this.derivePhotoTitle(originalFilename);
        const caption =
          single && dto.caption?.trim() ? dto.caption.trim().slice(0, 2000) : null;
        const row = await this.prisma.photo.create({
          data: {
            projectId: project.id,
            zoneId: null,
            elementId: null,
            observationId: null,
            pathologyId: null,
            interventionId: null,
            logbookId: null,
            fileKind: FileKind.PHOTO,
            originalFilename,
            mimeType: file.mimetype.slice(0, 255),
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: (up.asset_folder ?? folder).slice(0, 500),
            bytes: up.bytes,
            format: up.format?.slice(0, 32),
            title,
            caption,
            photoType: dto.photoType,
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Photos zone → `rg3cp/{code}/zones/{zone}/photos/{phase}` avec phase explicite. */
  async uploadZonePhotos(files: Express.Multer.File[], dto: UploadZonePhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const zone = await requireZone(this.prisma, dto.zoneId);
    const project = await requireProject(this.prisma, zone.projectId);
    const folder = this.cloudinaryPaths.zonePhotosFolderForPhaseRg3cp(
      project.code,
      zone.code,
      dto.photoPhase,
    );
    const single = files.length === 1;
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const originalFilename = (file.originalname || 'photo').slice(0, 500);
        const title =
          single && dto.title?.trim()
            ? dto.title.trim().slice(0, 500)
            : this.derivePhotoTitle(originalFilename);
        const caption =
          single && dto.caption?.trim() ? dto.caption.trim().slice(0, 2000) : null;
        const row = await this.prisma.photo.create({
          data: {
            projectId: zone.projectId,
            zoneId: zone.id,
            elementId: null,
            observationId: null,
            pathologyId: null,
            interventionId: null,
            logbookId: null,
            fileKind: FileKind.PHOTO,
            originalFilename,
            mimeType: file.mimetype.slice(0, 255),
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: (up.asset_folder ?? folder).slice(0, 500),
            bytes: up.bytes,
            format: up.format?.slice(0, 32),
            title,
            caption,
            photoType: dto.photoType,
            photoPhase: dto.photoPhase,
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Photos observation → `rg3cp/{project}/zones/{zone}/observations/{obsCode}/photos` */
  async uploadObservationPhotos(files: Express.Multer.File[], dto: UploadObservationPhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const obs = await this.prisma.observation.findUnique({
      where: { id: dto.observationId },
      include: { zone: true, element: true },
    });
    if (!obs) throw new NotFoundException('Observation introuvable');
    const project = await requireProject(this.prisma, obs.zone.projectId);
    const folder = this.cloudinaryPaths.observationPhotosFolderRg3cp(
      project.code,
      obs.zone.code,
      obs.code,
      obs.element?.code ?? null,
    );
    const single = files.length === 1;
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const originalFilename = (file.originalname || 'photo').slice(0, 500);
        const title =
          single && dto.title?.trim()
            ? dto.title.trim().slice(0, 500)
            : this.derivePhotoTitle(originalFilename);
        const caption =
          single && dto.caption?.trim() ? dto.caption.trim().slice(0, 2000) : null;
        const row = await this.prisma.photo.create({
          data: {
            projectId: obs.zone.projectId,
            zoneId: obs.zoneId,
            elementId: obs.elementId,
            observationId: obs.id,
            pathologyId: null,
            interventionId: null,
            logbookId: null,
            fileKind: FileKind.PHOTO,
            originalFilename,
            mimeType: file.mimetype.slice(0, 255),
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: (up.asset_folder ?? folder).slice(0, 500),
            bytes: up.bytes,
            format: up.format?.slice(0, 32),
            title,
            caption,
            photoPhase: dto.photoPhase,
            photoType: dto.photoType,
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Photos pathologie → `rg3cp/.../pathologies/{code}/photos` */
  async uploadPathologyPhotos(files: Express.Multer.File[], dto: UploadPathologyPhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const path = await this.prisma.pathology.findUnique({
      where: { id: dto.pathologyId },
      include: { zone: true },
    });
    if (!path) throw new NotFoundException('Pathologie introuvable');
    const project = await requireProject(this.prisma, path.zone.projectId);
    const folder = this.cloudinaryPaths.pathologyPhotosFolderRg3cp(
      project.code,
      path.zone.code,
      path.code,
    );
    const single = files.length === 1;
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const originalFilename = (file.originalname || 'photo').slice(0, 500);
        const title =
          single && dto.title?.trim()
            ? dto.title.trim().slice(0, 500)
            : this.derivePhotoTitle(originalFilename);
        const caption =
          single && dto.caption?.trim() ? dto.caption.trim().slice(0, 2000) : null;
        const photoType =
          dto.photoType?.trim()?.slice(0, 128) || 'DETAIL';
        const row = await this.prisma.photo.create({
          data: {
            projectId: path.zone.projectId,
            zoneId: path.zoneId,
            elementId: path.elementId,
            observationId: path.observationId,
            pathologyId: path.id,
            interventionId: null,
            logbookId: null,
            fileKind: FileKind.PHOTO,
            originalFilename,
            mimeType: file.mimetype.slice(0, 255),
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: (up.asset_folder ?? folder).slice(0, 500),
            bytes: up.bytes,
            format: up.format?.slice(0, 32),
            title,
            caption,
            photoType,
            ...(dto.photoPhase !== undefined ? { photoPhase: dto.photoPhase } : {}),
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Photos intervention → `rg3cp/.../interventions/{code}/photos` */
  async uploadInterventionPhotos(files: Express.Multer.File[], dto: UploadInterventionPhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const inv = await this.prisma.intervention.findUnique({
      where: { id: dto.interventionId },
      include: { zone: true, decision: true },
    });
    if (!inv) throw new NotFoundException('Intervention introuvable');
    const project = await requireProject(this.prisma, inv.zone.projectId);
    const folder = this.cloudinaryPaths.interventionPhotosFolderRg3cp(
      project.code,
      inv.zone.code,
      inv.code,
    );
    const single = files.length === 1;
    const created: Photo[] = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
          );
        }
        const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
        const originalFilename = (file.originalname || 'photo').slice(0, 500);
        const title =
          single && dto.title?.trim()
            ? dto.title.trim().slice(0, 500)
            : this.derivePhotoTitle(originalFilename);
        const caption =
          single && dto.caption?.trim() ? dto.caption.trim().slice(0, 2000) : null;
        const photoType = dto.photoType?.trim()?.slice(0, 128) || 'DETAIL';
        const row = await this.prisma.photo.create({
          data: {
            projectId: inv.zone.projectId,
            zoneId: inv.zoneId,
            elementId: inv.elementId,
            observationId: inv.decision.observationId,
            pathologyId: inv.pathologyId ?? inv.decision.pathologyId,
            interventionId: inv.id,
            logbookId: null,
            fileKind: FileKind.PHOTO,
            originalFilename,
            mimeType: file.mimetype.slice(0, 255),
            url: up.url,
            secureUrl: up.secure_url,
            publicId: up.public_id,
            assetFolder: (up.asset_folder ?? folder).slice(0, 500),
            bytes: up.bytes,
            format: up.format?.slice(0, 32),
            title,
            caption,
            photoType,
            ...(dto.photoPhase !== undefined ? { photoPhase: dto.photoPhase } : {}),
          },
        });
        created.push(row);
      }
      return { data: created };
    } catch (e) {
      handlePrismaError(e);
    }
  }

  private derivePhotoTitle(originalFilename: string): string {
    const base = originalFilename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
    const cleaned = base.replace(/[_]+/g, ' ').trim();
    return (cleaned || originalFilename).slice(0, 500);
  }

  async findAll(query: QueryPhotoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.PhotoWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.projectOnly && query.projectId) {
      where.zoneId = null;
      where.elementId = null;
      where.observationId = null;
      where.pathologyId = null;
      where.interventionId = null;
      where.logbookId = null;
    }
    if (query.zoneOnly && query.zoneId) {
      where.zoneId = query.zoneId;
      where.elementId = null;
      where.observationId = null;
      where.pathologyId = null;
      where.interventionId = null;
      where.logbookId = null;
    }
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.elementId) where.elementId = query.elementId;
    if (query.observationId) where.observationId = query.observationId;
    if (query.pathologyId) where.pathologyId = query.pathologyId;
    if (query.interventionId) where.interventionId = query.interventionId;
    if (query.logbookId) where.logbookId = query.logbookId;
    if (query.authorName?.length) {
      where.authorName = { contains: query.authorName, mode: 'insensitive' };
    }
    if (query.fileKind) where.fileKind = query.fileKind;
    if (query.search?.length) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { caption: { contains: query.search, mode: 'insensitive' } },
        { photoType: { contains: query.search, mode: 'insensitive' } },
        { originalFilename: { contains: query.search, mode: 'insensitive' } },
        { publicId: { contains: query.search, mode: 'insensitive' } },
        { authorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.photo.count({ where }),
      this.prisma.photo.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          project: true,
          zone: true,
          element: true,
          observation: true,
          pathology: true,
          intervention: true,
          logbook: true,
          authorActor: true,
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const p = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        project: true,
        zone: true,
        element: true,
        observation: true,
        pathology: true,
        intervention: true,
        logbook: true,
        authorActor: true,
      },
    });
    if (!p) throw new NotFoundException('Photo not found');
    return p;
  }

  async update(id: string, dto: UpdatePhotoDto) {
    const existing = await this.prisma.photo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Photo not found');
    assertPhotoHasContext(this.mergeContext(existing, dto));
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      const { authorName, ...rest } = dto;
      return await this.prisma.photo.update({
        where: { id },
        data: {
          ...rest,
          ...(authorName !== undefined
            ? { authorName: authorName?.trim() || null }
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
      await this.prisma.photo.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
