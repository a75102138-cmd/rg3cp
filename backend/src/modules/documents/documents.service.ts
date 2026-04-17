import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Document, Prisma, StorageType } from '@prisma/client';
import { isValidBddCategory, isValidSubcategory } from '../../common/constants/bdd-categories';
import {
  buildDocumentFolderPath,
  isValidDocumentFolder,
} from '../../common/constants/document-folders';
import { isEssaisBddCategory, isValidEssaisFolder } from '../../common/constants/essais-folders';
import {
  isValidLogbookFolder,
  LOGBOOK_BDD_CATEGORY,
} from '../../common/constants/logbook-folders';
import { isRiskBddCategory, isValidRiskFolder, isValidRiskTable } from '../../common/constants/risk-folders';
import {
  parseBusinessDateString,
  parseOptionalBusinessDateString,
} from '../../common/utils/business-date.util';
import { resolveDateRangePreset } from '../../common/utils/date-range-preset.util';
import { whereDocumentEffectiveDateInRange } from '../../common/utils/effective-date-where.util';
import { buildMeta, getSkip } from '../../common/utils/pagination.util';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  assertDocumentHasContext,
  requireActor,
  requireProject,
  requireZone,
} from '../../common/validation/domain-validation';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryPathBuilderService } from '../cloudinary/cloudinary-path-builder.service';
import { CloudinaryUploadService } from '../cloudinary/cloudinary-upload.service';
import { B2UploadService } from '../cloudinary/b2-upload.service';
import { JwtRequestUser } from '../auth/auth.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DOCUMENT_SORT, QueryDocumentDto } from './dto/query-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadProjectDocumentBodyDto } from './dto/upload-project-document.dto';
import { UploadObservationDocumentBodyDto } from './dto/upload-observation-document.dto';
import { UploadDecisionDocumentBodyDto } from './dto/upload-decision-document.dto';
import { UploadInterventionDocumentBodyDto } from './dto/upload-intervention-document.dto';
import { UploadPathologyDocumentBodyDto } from './dto/upload-pathology-document.dto';
import { UploadZoneDocumentBodyDto } from './dto/upload-zone-document.dto';
import { UploadDocumentUnifiedDto } from './dto/upload-document-unified.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    readonly cloudinaryPaths: CloudinaryPathBuilderService,
    private readonly cloudinaryUpload: CloudinaryUploadService,
    private readonly b2Upload: B2UploadService,
  ) {}

  private orderBy(
    q: QueryDocumentDto,
  ): Prisma.DocumentOrderByWithRelationInput | Prisma.DocumentOrderByWithRelationInput[] {
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    const field =
      q.sortBy && DOCUMENT_SORT.includes(q.sortBy as (typeof DOCUMENT_SORT)[number])
        ? q.sortBy
        : null;
    if (field === 'documentDate') {
      return [
        { documentDate: { sort: dir, nulls: 'last' } },
        { createdAt: dir },
      ];
    }
    if (field) {
      return { [field]: dir };
    }
    return [
      { documentDate: { sort: dir, nulls: 'last' } },
      { createdAt: dir },
    ];
  }

  private mergeContext(existing: Document, dto: UpdateDocumentDto) {
    return {
      projectId: dto.projectId !== undefined ? dto.projectId : existing.projectId,
      zoneId: dto.zoneId !== undefined ? dto.zoneId : existing.zoneId,
      observationId: dto.observationId !== undefined ? dto.observationId : existing.observationId,
      pathologyId: dto.pathologyId !== undefined ? dto.pathologyId : existing.pathologyId,
      decisionId: dto.decisionId !== undefined ? dto.decisionId : existing.decisionId,
      interventionId: dto.interventionId !== undefined ? dto.interventionId : existing.interventionId,
      logbookId: dto.logbookId !== undefined ? dto.logbookId : existing.logbookId,
    };
  }

  private ensureFiles(files: Express.Multer.File[] | undefined): Express.Multer.File[] {
    const valid = (files ?? []).filter((f) => Boolean(f?.buffer?.length));
    if (!valid.length) {
      throw new BadRequestException('Au moins un fichier est requis');
    }
    return valid;
  }

  private toDateFolder(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isImageMimeType(mimeType: string): boolean {
    return (mimeType || '').toLowerCase().startsWith('image/');
  }

  /**
   * Fixes common mojibake from multipart filenames (e.g. "DÃ©claration" -> "Déclaration").
   * Keeps original value when conversion looks suspicious.
   */
  private normalizeUploadedFilename(name?: string): string {
    const raw = (name || 'document').trim() || 'document';
    if (!/[ÃÂâ]/.test(raw)) return raw;
    try {
      const repaired = Buffer.from(raw, 'latin1').toString('utf8').trim();
      if (!repaired) return raw;
      const badScore = (raw.match(/[ÃÂâ]/g) || []).length;
      const repairedScore = (repaired.match(/[ÃÂâ]/g) || []).length;
      return repairedScore < badScore ? repaired : raw;
    } catch {
      return raw;
    }
  }

  private async uploadByStorage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
    storageType: StorageType;
  }> {
    const mimeType = file.mimetype || 'application/octet-stream';
    if (this.isImageMimeType(mimeType)) {
      const up = await this.cloudinaryUpload.uploadDocumentBuffer(file.buffer, mimeType, folder);
      return { ...up, storageType: StorageType.CLOUDINARY };
    }
    const safeOriginalName = this.normalizeUploadedFilename(file.originalname);
    const key = `${folder}/${Date.now()}-${safeOriginalName.replace(/[^\w.\-() ]+/g, '_')}`;
    const up = await this.b2Upload.uploadBuffer(file.buffer, mimeType, key);
    return { ...up, storageType: StorageType.B2 };
  }

  async create(dto: CreateDocumentDto) {
    assertDocumentHasContext(dto);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    const { documentDate, ...rest } = dto;
    try {
      return await this.prisma.document.create({
        data: {
          ...rest,
          documentDate: parseOptionalBusinessDateString(documentDate),
          authorName: dto.authorName?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryDocumentDto, user?: JwtRequestUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    let where: Prisma.DocumentWhereInput = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.projectOnly && query.projectId) {
      where.zoneId = null;
      where.observationId = null;
      where.pathologyId = null;
      where.decisionId = null;
      where.interventionId = null;
      where.logbookId = null;
    }
    if (query.zoneOnly && query.zoneId) {
      where.zoneId = query.zoneId;
      where.observationId = null;
      where.pathologyId = null;
      where.decisionId = null;
      where.interventionId = null;
      where.logbookId = null;
    }
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.observationId) where.observationId = query.observationId;
    if (query.pathologyId) where.pathologyId = query.pathologyId;
    if (query.decisionId) where.decisionId = query.decisionId;
    if (query.interventionId) where.interventionId = query.interventionId;
    if (query.logbookId) where.logbookId = query.logbookId;
    if (query.authorName?.length) {
      where.authorName = { contains: query.authorName, mode: 'insensitive' };
    }
    if (query.fileKind) where.fileKind = query.fileKind;
    if (query.status) (where as any).status = query.status;
    if (query.category) (where as any).category = query.category;
    if (query.subCategory) (where as any).subCategory = query.subCategory;
    if ((query as any).bddCategory) (where as any).bddCategory = (query as any).bddCategory;
    if ((query as any).tableName) (where as any).tableName = (query as any).tableName;
    if ((query as any).subFolder) (where as any).subFolder = (query as any).subFolder;
    if (query.relatedZoneId) (where as any).relatedZoneId = query.relatedZoneId;
    if (query.search?.length) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { originalFilename: { contains: query.search, mode: 'insensitive' } },
        { publicId: { contains: query.search, mode: 'insensitive' } },
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
      const dateWhere = whereDocumentEffectiveDateInRange(from, to);
      where = { AND: [where, dateWhere] };
    }

    // Pending visibility rules (PENDING is special):
    // - ADMIN: sees everything.
    // - USER (uploader): sees PENDING only for documents they uploaded.
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
        const pendingVisibilityForActeur: Prisma.DocumentWhereInput = {
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
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.orderBy(query),
        include: {
          project: true,
          zone: true,
          observation: true,
          pathology: true,
          decision: true,
          intervention: true,
          logbook: true,
          authorActor: true,
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          validatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
  }

  async uploadUnified(files: Express.Multer.File[], dto: UploadDocumentUnifiedDto, userId: string) {
    const validFiles = this.ensureFiles(files);
    const isLogbook = dto.bddCategory === LOGBOOK_BDD_CATEGORY;
    const isRisk = isRiskBddCategory(dto.bddCategory);
    const isEssais = isEssaisBddCategory(dto.bddCategory);
    const hasFolderContext = Boolean(dto.bddCategory && dto.tableName);
    const hasSubFolder = Boolean(dto.subFolder?.trim());
    if (!hasFolderContext && !isValidBddCategory(dto.category)) {
      throw new BadRequestException('Catégorie BDD invalide');
    }
    if (!hasFolderContext && !isValidSubcategory(dto.category, dto.subCategory)) {
      throw new BadRequestException('Sous-catégorie invalide pour cette catégorie');
    }
    if (
      hasFolderContext &&
      hasSubFolder &&
      !isLogbook &&
      !isRisk &&
      !isValidDocumentFolder(dto.bddCategory!, dto.tableName!, dto.subFolder!)
    ) {
      throw new BadRequestException('bddCategory/tableName/subFolder invalides');
    }
    if (isLogbook && !isValidLogbookFolder(dto.tableName!, dto.subFolder)) {
      throw new BadRequestException('tableName/subFolder logbook invalides');
    }
    if (isRisk && !isValidRiskTable(dto.bddCategory!, dto.tableName!)) {
      throw new BadRequestException('bddCategory/tableName risques invalides');
    }
    if (isRisk && !isValidRiskFolder(dto.bddCategory!, dto.tableName!, dto.subFolder)) {
      throw new BadRequestException('bddCategory/tableName/subFolder risques invalides');
    }
    if (isEssais && !isValidEssaisFolder(dto.tableName!, dto.subFolder)) {
      throw new BadRequestException('tableName/subFolder essais invalides');
    }
    if (dto.scope === 'ZONE' && !dto.relatedZoneId) {
      throw new BadRequestException('relatedZoneId est requis pour scope=ZONE');
    }
    const project = await requireProject(this.prisma, dto.projectId);
    if (dto.relatedZoneId) {
      const zone = await requireZone(this.prisma, dto.relatedZoneId);
      if (zone.projectId !== project.id) {
        throw new BadRequestException('La zone liée n’appartient pas au projet');
      }
    }
    const takenAt = parseOptionalBusinessDateString(dto.documentDate) ?? new Date();
    const dateFolder = this.toDateFolder(takenAt);
    const baseSubFolder = dto.subFolder?.trim() || dateFolder;
    const effectiveSubFolder =
      isLogbook && baseSubFolder === 'PV_MANIFOLD'
        ? `PV_MANIFOLD/${dateFolder}`
        : baseSubFolder;
    const baseFolder = hasFolderContext
      ? isLogbook
        ? this.cloudinaryPaths.unifiedJournalModuleFolder(
            project.code,
            dto.tableName!,
            effectiveSubFolder,
            dateFolder,
          )
        : isRisk
          ? this.cloudinaryPaths.unifiedDocumentsModuleFolder(
              project.code,
              dto.bddCategory!,
              dto.tableName!,
              effectiveSubFolder,
            )
          : isEssais
            ? this.cloudinaryPaths.unifiedEssaisModuleFolder(
                project.code,
                dto.tableName!,
                effectiveSubFolder,
              )
            : hasSubFolder
              ? this.cloudinaryPaths.unifiedDocumentsModuleFolder(
                  project.code,
                  dto.bddCategory!,
                  dto.tableName!,
                  dto.subFolder!,
                )
              : this.cloudinaryPaths.unifiedDocumentsTableFolder(
                  project.code,
                  dto.bddCategory!,
                  dto.tableName!,
                )
      : this.cloudinaryPaths.projectDocumentsFolderForType(project.code, dto.fileKind);
    const folderPath = hasFolderContext
      ? isLogbook
        ? `${LOGBOOK_BDD_CATEGORY}/${dto.tableName}/${effectiveSubFolder}/${dateFolder}`
        : isRisk
          ? `${dto.bddCategory}/${dto.tableName}/${effectiveSubFolder}`
        : isEssais
          ? `${dto.bddCategory}/${dto.tableName}/${effectiveSubFolder}`
        : dto.folderPath?.trim() || buildDocumentFolderPath(dto.bddCategory!, dto.tableName!, dto.subFolder)
      : null;
    const data: Document[] = [];
    for (const file of validFiles) {
      const uploaded = await this.uploadByStorage(file, baseFolder);
      const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
      data.push(
        await this.prisma.document.create({
          data: {
            fileKind: dto.fileKind,
            originalFilename,
            mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
            url: uploaded.url,
            secureUrl: uploaded.secure_url,
            publicId: uploaded.public_id,
            assetFolder: (uploaded.asset_folder ?? baseFolder).slice(0, 500),
            bytes: uploaded.bytes,
            format: uploaded.format?.slice(0, 32),
            storageType: uploaded.storageType,
            title: this.deriveDocumentTitle(originalFilename),
            documentDate: takenAt,
            category: dto.category,
            subCategory: dto.subCategory?.trim() || null,
            bddCategory: dto.bddCategory?.trim() || null,
            tableName: dto.tableName?.trim() || null,
            subFolder: effectiveSubFolder || null,
            folderPath,
            status: 'PENDING',
            scope: dto.scope,
            uploadedById: userId,
            relatedZoneId: dto.relatedZoneId ?? null,
            projectId: project.id,
            zoneId: dto.scope === 'ZONE' ? dto.relatedZoneId ?? null : null,
            observationId: null,
            pathologyId: null,
            decisionId: null,
            interventionId: null,
            logbookId: null,
          },
        } as any),
      );
    }
    return { data };
  }

  /** Upload multipart → Cloudinary `rg3cp/{code}/documents/{type}` → enregistrement projet seul. */
  async uploadProjectDocuments(files: Express.Multer.File[], dto: UploadProjectDocumentBodyDto) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadProjectDocument(file, dto)));
    return { data };
  }

  /** Upload multipart (batch) → un enregistrement Document par fichier. */
  async uploadProjectDocument(file: Express.Multer.File, dto: UploadProjectDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const project = await requireProject(this.prisma, dto.projectId);
    const folder = this.cloudinaryPaths.projectDocumentsFolderForType(project.code, dto.fileKind);
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: project.id,
          zoneId: null,
          observationId: null,
          pathologyId: null,
          decisionId: null,
          interventionId: null,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Upload → Cloudinary `rg3cp/{code}/zones/{zone}/documents/{type}` — document lié à la zone seule. */
  async uploadZoneDocuments(files: Express.Multer.File[], dto: UploadZoneDocumentBodyDto) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadZoneDocument(file, dto)));
    return { data };
  }

  /** Upload batch zone → un enregistrement Document par fichier. */
  async uploadZoneDocument(file: Express.Multer.File, dto: UploadZoneDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const zone = await requireZone(this.prisma, dto.zoneId);
    const project = await requireProject(this.prisma, zone.projectId);
    const folder = this.cloudinaryPaths.zoneDocumentsFolderForRg3cp(project.code, zone.code, dto.fileKind);
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: zone.projectId,
          zoneId: zone.id,
          observationId: null,
          pathologyId: null,
          decisionId: null,
          interventionId: null,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** `rg3cp/.../pathologies/{code}/documents/{type}` */
  async uploadPathologyDocuments(files: Express.Multer.File[], dto: UploadPathologyDocumentBodyDto) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadPathologyDocument(file, dto)));
    return { data };
  }

  /** `rg3cp/.../observations/{code}/documents/{type}` (+ éléments/{code} si observation rattachée à un élément). */
  async uploadObservationDocuments(files: Express.Multer.File[], dto: UploadObservationDocumentBodyDto) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadObservationDocument(file, dto)));
    return { data };
  }

  async uploadObservationDocument(file: Express.Multer.File, dto: UploadObservationDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const observation = await this.prisma.observation.findUnique({
      where: { id: dto.observationId },
      include: { zone: true, element: true },
    });
    if (!observation) throw new NotFoundException('Observation introuvable');
    const project = await requireProject(this.prisma, observation.zone.projectId);
    const folder = this.cloudinaryPaths.observationDocumentsFolderForRg3cp(
      project.code,
      observation.zone.code,
      observation.code,
      dto.fileKind,
      observation.element?.code ?? null,
    );
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: observation.zone.projectId,
          zoneId: observation.zoneId,
          observationId: observation.id,
          pathologyId: null,
          decisionId: null,
          interventionId: null,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async uploadPathologyDocument(file: Express.Multer.File, dto: UploadPathologyDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const pathology = await this.prisma.pathology.findUnique({
      where: { id: dto.pathologyId },
      include: { zone: true },
    });
    if (!pathology) throw new NotFoundException('Pathologie introuvable');
    const project = await requireProject(this.prisma, pathology.zone.projectId);
    const folder = this.cloudinaryPaths.pathologyDocumentsFolderForRg3cp(
      project.code,
      pathology.zone.code,
      pathology.code,
      dto.fileKind,
    );
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: pathology.zone.projectId,
          zoneId: pathology.zoneId,
          observationId: pathology.observationId,
          pathologyId: pathology.id,
          decisionId: null,
          interventionId: null,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** `rg3cp/.../decisions/{code}/documents/{type}` */
  async uploadDecisionDocuments(files: Express.Multer.File[], dto: UploadDecisionDocumentBodyDto) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadDecisionDocument(file, dto)));
    return { data };
  }

  async uploadDecisionDocument(file: Express.Multer.File, dto: UploadDecisionDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const decision = await this.prisma.decision.findUnique({
      where: { id: dto.decisionId },
      include: { zone: true },
    });
    if (!decision) throw new NotFoundException('Décision introuvable');
    const project = await requireProject(this.prisma, decision.zone.projectId);
    const folder = this.cloudinaryPaths.decisionDocumentsFolderForRg3cp(
      project.code,
      decision.zone.code,
      decision.code,
      dto.fileKind,
    );
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: decision.zone.projectId,
          zoneId: decision.zoneId,
          observationId: decision.observationId,
          pathologyId: decision.pathologyId,
          decisionId: decision.id,
          interventionId: null,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** `rg3cp/.../interventions/{code}/documents/{type}` */
  async uploadInterventionDocuments(
    files: Express.Multer.File[],
    dto: UploadInterventionDocumentBodyDto,
  ) {
    const validFiles = this.ensureFiles(files);
    const data = await Promise.all(validFiles.map((file) => this.uploadInterventionDocument(file, dto)));
    return { data };
  }

  async uploadInterventionDocument(file: Express.Multer.File, dto: UploadInterventionDocumentBodyDto) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis');
    }
    const inv = await this.prisma.intervention.findUnique({
      where: { id: dto.interventionId },
      include: { zone: true, decision: true },
    });
    if (!inv) throw new NotFoundException('Intervention introuvable');
    const project = await requireProject(this.prisma, inv.zone.projectId);
    const folder = this.cloudinaryPaths.interventionDocumentsFolderForRg3cp(
      project.code,
      inv.zone.code,
      inv.code,
      dto.fileKind,
    );
    const uploaded = await this.uploadByStorage(file, folder);
    const originalFilename = this.normalizeUploadedFilename(file.originalname).slice(0, 500);
    const title = this.deriveDocumentTitle(originalFilename);
    const pathologyId = inv.pathologyId ?? inv.decision.pathologyId;
    try {
      return await this.prisma.document.create({
        data: {
          fileKind: dto.fileKind,
          originalFilename,
          mimeType: (file.mimetype || 'application/octet-stream').slice(0, 255),
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          assetFolder: (uploaded.asset_folder ?? folder).slice(0, 500),
          bytes: uploaded.bytes,
          format: uploaded.format?.slice(0, 32),
          storageType: uploaded.storageType,
          title,
          documentDate: parseOptionalBusinessDateString(dto.documentDate),
          projectId: inv.zone.projectId,
          zoneId: inv.zoneId,
          observationId: inv.decision.observationId,
          pathologyId,
          decisionId: inv.decisionId,
          interventionId: inv.id,
          logbookId: null,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  /** Titre affiché : conserve exactement le nom de fichier uploadé. */
  private deriveDocumentTitle(originalFilename: string): string {
    return originalFilename.slice(0, 500);
  }

  async findOne(id: string) {
    const d = await this.prisma.document.findUnique({
      where: { id },
      include: {
        project: true,
        zone: true,
        observation: true,
        pathology: true,
        decision: true,
        intervention: true,
        logbook: true,
        authorActor: true,
        pvForDecision: true,
      },
    });
    if (!d) throw new NotFoundException('Document not found');
    return d;
  }

  async generateSignedUrl(id: string): Promise<{ url: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }
    if (doc.storageType !== StorageType.B2) {
      return { url: doc.secureUrl || doc.url };
    }
    const key = doc.publicId?.trim();
    if (!key) {
      throw new BadRequestException('Document B2 invalide: clé manquante');
    }
    const url = await this.b2Upload.getSignedUrl(key, 3600);
    return { url };
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document not found');
    assertDocumentHasContext(this.mergeContext(existing, dto));
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      const { authorName, documentDate, ...rest } = dto;
      return await this.prisma.document.update({
        where: { id },
        data: {
          ...rest,
          ...(authorName !== undefined
            ? { authorName: authorName?.trim() || null }
            : {}),
          ...(documentDate !== undefined
            ? {
                documentDate: documentDate ? parseBusinessDateString(documentDate) : null,
              }
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
      await this.prisma.document.delete({ where: { id } });
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
    return this.prisma.document.update({
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
