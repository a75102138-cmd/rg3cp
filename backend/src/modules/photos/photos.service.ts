import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FileKind, Photo, Prisma, StorageType } from '@prisma/client';
import { isValidBddCategory, isValidSubcategory } from '../../common/constants/bdd-categories';
import {
  buildMediaFolderPath,
  isValidMediaFolder,
  MEDIA_BDD_CATEGORY,
} from '../../common/constants/media-folders';
import {
  parseBusinessDateString,
  parseOptionalBusinessDateString,
} from '../../common/utils/business-date.util';
import { resolveDateRangePreset } from '../../common/utils/date-range-preset.util';
import { extractDateTimeOriginalFromImageBuffer } from '../../common/utils/exif-taken-at.util';
import { wherePhotoEffectiveDateInRange } from '../../common/utils/effective-date-where.util';
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
import { B2UploadService } from '../cloudinary/b2-upload.service';
import { JwtRequestUser } from '../auth/auth.types';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PHOTO_SORT, QueryPhotoDto } from './dto/query-photo.dto';
import { UploadProjectPhotosBodyDto } from './dto/upload-project-photos.dto';
import { UploadObservationPhotosBodyDto } from './dto/upload-observation-photos.dto';
import { UploadInterventionPhotosBodyDto } from './dto/upload-intervention-photos.dto';
import { UploadPathologyPhotosBodyDto } from './dto/upload-pathology-photos.dto';
import { UploadZonePhotosBodyDto } from './dto/upload-zone-photos.dto';
import { UploadJournalPhotosBodyDto } from './dto/upload-journal-photos.dto';
import { UploadPhotoUnifiedDto } from './dto/upload-photo-unified.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    readonly cloudinaryPaths: CloudinaryPathBuilderService,
    private readonly cloudinaryUpload: CloudinaryUploadService,
    private readonly b2Upload: B2UploadService,
  ) {}

  private orderBy(
    q: QueryPhotoDto,
  ): Prisma.PhotoOrderByWithRelationInput | Prisma.PhotoOrderByWithRelationInput[] {
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    const field =
      q.sortBy && PHOTO_SORT.includes(q.sortBy as (typeof PHOTO_SORT)[number])
        ? q.sortBy
        : null;
    if (field === 'takenAt') {
      return [
        { takenAt: { sort: dir, nulls: 'last' } },
        { createdAt: dir },
      ];
    }
    if (field) {
      return { [field]: dir };
    }
    return [
      { takenAt: { sort: dir, nulls: 'last' } },
      { createdAt: dir },
    ];
  }

  /** Date manuelle d'abord, sinon EXIF DateTimeOriginal, sinon date courante. */
  private async resolveTakenAtForUpload(
    file: Express.Multer.File,
    bodyTakenAt?: string,
  ): Promise<Date> {
    try {
      const parsed = parseOptionalBusinessDateString(bodyTakenAt);
      if (parsed) return parsed;
    } catch {
      // Ignore invalid manual date and fallback to now.
    }
    const fromExif = await extractDateTimeOriginalFromImageBuffer(file.buffer);
    if (fromExif) return fromExif;
    return new Date();
  }

  private toDateFolder(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
    const { takenAt, ...rest } = dto;
    try {
      return await this.prisma.photo.create({
        data: {
          ...rest,
          fileKind: dto.fileKind ?? FileKind.PHOTO,
          takenAt: takenAt ? parseBusinessDateString(takenAt) : undefined,
          authorName: dto.authorName?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /**
   * Upload images vers Cloudinary (rg3cp/{code}/journal/photos) et crée les Photo liées au projet + journal.
   */
  async uploadJournalPhotos(files: Express.Multer.File[], dto: UploadJournalPhotosBodyDto) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    const { projectId, logbookId } = dto;
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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
        const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
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
            ...(takenAt ? { takenAt } : {}),
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

  async findAll(query: QueryPhotoDto, user?: JwtRequestUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    let where: Prisma.PhotoWhereInput = {};
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
    if (query.status) (where as any).status = query.status;
    if (query.category) (where as any).category = query.category;
    if (query.subCategory) (where as any).subCategory = query.subCategory;
    if (query.bddCategory) (where as any).bddCategory = query.bddCategory;
    if (query.tableName) (where as any).tableName = query.tableName;
    if (query.subFolder) (where as any).subFolder = query.subFolder;
    if (query.relatedZoneId) (where as any).relatedZoneId = query.relatedZoneId;
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
    const presetRange = resolveDateRangePreset(query.datePreset);
    if (presetRange || query.dateFrom || query.dateTo) {
      const from =
        presetRange?.from ??
        (query.dateFrom ? new Date(query.dateFrom) : new Date(0));
      const to =
        presetRange?.to ??
        (query.dateTo ? new Date(query.dateTo) : new Date(8640000000000000));
      const dateWhere = wherePhotoEffectiveDateInRange(from, to);
      where = { AND: [where, dateWhere] };
    }

    // Pending visibility rules (PENDING is special):
    // - ADMIN: sees everything.
    // - USER (uploader): sees PENDING only for media they uploaded.
    // - ACTEUR (validator): sees PENDING only for projects they are assigned to.
    // - When `status` is explicitly requested as PENDING, we still apply these restrictions.
    if (user && user.role !== 'ADMIN' && (query.status === undefined || query.status === 'PENDING')) {
      if (user.role === 'USER') {
        if (query.status === 'PENDING') {
          where = { AND: [where, { uploadedById: user.sub }] };
        } else {
          where = {
            AND: [
              where,
              {
                OR: [
                  { status: { not: 'PENDING' } },
                  { status: 'PENDING', uploadedById: user.sub },
                ],
              },
            ],
          };
        }
      }

      if (user.role === 'ACTEUR') {
        const pendingVisibilityForActeur: Prisma.PhotoWhereInput = {
          OR: [
            { project: { userAssignments: { some: { userId: user.sub } } } },
            { uploadedBy: { defaultValidatorUserId: user.sub } },
          ],
        };
        const projectId = query.projectId;
        if (projectId) {
          if (query.status === 'PENDING') {
            where = { AND: [where, pendingVisibilityForActeur] };
          } else {
            where = {
              AND: [
                where,
                {
                  OR: [
                    { status: { not: 'PENDING' } },
                    { status: 'PENDING', ...pendingVisibilityForActeur },
                  ],
                },
              ],
            };
          }
        } else {
          if (query.status === 'PENDING') {
            where = { AND: [where, pendingVisibilityForActeur] };
          } else {
            where = {
              AND: [
                where,
                {
                  OR: [
                    { status: { not: 'PENDING' } },
                    { status: 'PENDING', ...pendingVisibilityForActeur },
                  ],
                },
              ],
            };
          }
        }
      }
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

  async uploadUnified(files: Express.Multer.File[], dto: UploadPhotoUnifiedDto, userId: string) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    if (dto.bddCategory !== MEDIA_BDD_CATEGORY) {
      throw new BadRequestException('bddCategory invalide');
    }
    const isZoneSimpleMedia =
      dto.scope === 'ZONE' && dto.tableName === 'zone-media' && dto.subFolder === 'avancement';
    if (!isZoneSimpleMedia && !isValidMediaFolder(dto.tableName, dto.subFolder)) {
      throw new BadRequestException('tableName/subFolder invalides');
    }
    const folderPathBase =
      dto.folderPath?.trim() || buildMediaFolderPath(dto.bddCategory, dto.tableName, dto.subFolder);
    if (!isValidBddCategory(dto.category)) {
      throw new BadRequestException('Catégorie BDD invalide');
    }
    if (!isValidSubcategory(dto.category, dto.subCategory)) {
      throw new BadRequestException('Sous-catégorie invalide pour cette catégorie');
    }
    if (dto.scope === 'ZONE' && !dto.relatedZoneId) {
      throw new BadRequestException('relatedZoneId est requis pour scope=ZONE');
    }
    const project = await requireProject(this.prisma, dto.projectId);
    let relatedZone: { code: string; projectId: string } | null = null;
    if (dto.relatedZoneId) {
      const z = await requireZone(this.prisma, dto.relatedZoneId);
      if (z.projectId !== project.id) {
        throw new BadRequestException('La zone liée n’appartient pas au projet');
      }
      relatedZone = z;
    }
    const baseFolder =
      dto.scope === 'ZONE' && relatedZone
        ? isZoneSimpleMedia
          ? this.cloudinaryPaths.unifiedMediaZoneAvancementFolder(project.code, relatedZone.code)
          : this.cloudinaryPaths.unifiedMediaZoneModuleFolder(
              project.code,
              relatedZone.code,
              dto.tableName,
              dto.subFolder,
            )
        : this.cloudinaryPaths.unifiedMediaModuleFolder(
            project.code,
            dto.tableName,
            dto.subFolder,
          );
    const data: Photo[] = [];
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `Fichier non autorisé (${file.originalname}) : seules les images sont acceptées.`,
        );
      }
      const takenAt = await this.resolveTakenAtForUpload(file, dto.takenAt);
      const dateFolder = this.toDateFolder(takenAt);
      const folder = isZoneSimpleMedia ? baseFolder : `${baseFolder}/${dateFolder}`;
      const folderPath = isZoneSimpleMedia ? folderPathBase : `${folderPathBase}/${dateFolder}`;
      const up = await this.cloudinaryUpload.uploadImageBuffer(file.buffer, file.mimetype, folder);
      const originalFilename = (file.originalname || 'photo').slice(0, 500);
      data.push(
        await this.prisma.photo.create({
          data: {
            projectId: project.id,
            zoneId: dto.scope === 'ZONE' ? dto.relatedZoneId ?? null : null,
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
            title: dto.title?.trim() || this.derivePhotoTitle(originalFilename),
            caption: dto.caption?.trim() || null,
            category: dto.category,
            subCategory: dto.subCategory?.trim() || null,
            bddCategory: dto.bddCategory,
            tableName: dto.tableName,
            subFolder: dto.subFolder,
            folderPath,
            dateFolder,
            status: 'PENDING',
            scope: dto.scope,
            relatedZoneId: dto.relatedZoneId ?? null,
            uploadedById: userId,
            takenAt,
          } as any,
        }),
      );
    }
    return { data };
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

  async generateSignedUrl(id: string): Promise<{ url: string }> {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    if (photo.storageType !== StorageType.B2) {
      return { url: photo.secureUrl || photo.url };
    }
    const key = photo.publicId?.trim();
    if (!key) {
      throw new BadRequestException('Photo B2 invalide: clé manquante');
    }
    const url = await this.b2Upload.getSignedUrl(key, 3600);
    return { url };
  }

  async update(id: string, dto: UpdatePhotoDto) {
    const existing = await this.prisma.photo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Photo not found');
    assertPhotoHasContext(this.mergeContext(existing, dto));
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      const { authorName, takenAt, ...rest } = dto;
      return await this.prisma.photo.update({
        where: { id },
        data: {
          ...rest,
          ...(authorName !== undefined
            ? { authorName: authorName?.trim() || null }
            : {}),
          ...(takenAt !== undefined
            ? { takenAt: takenAt ? parseBusinessDateString(takenAt) : null }
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

  async setReviewStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    validatorId: string,
    remarks?: string,
  ) {
    const existing = await this.findOne(id);
    if ((existing as any).status !== 'PENDING') {
      throw new BadRequestException('Seuls les fichiers PENDING peuvent être validés/rejetés');
    }
    if (!existing.projectId) {
      throw new ForbiddenException('Validation impossible sans projet assigné.');
    }
    const assignment = await this.prisma.projectUserAssignment.findUnique({
      where: {
        projectId_userId: {
          projectId: existing.projectId,
          userId: validatorId,
        },
      },
      select: { id: true },
    });
    const defaultValidatorLink = existing.uploadedById
      ? await this.prisma.user.findFirst({
          where: {
            id: existing.uploadedById,
            defaultValidatorUserId: validatorId,
          },
          select: { id: true },
        })
      : null;
    if (!assignment && !defaultValidatorLink) {
      throw new ForbiddenException('Validation réservée à l’acteur assigné à ce projet.');
    }
    return this.prisma.photo.update({
      where: { id },
      data: {
        status,
        validatedById: validatorId,
        validatedAt: new Date(),
        remarks: remarks?.trim() || null,
      } as any,
    });
  }
}
