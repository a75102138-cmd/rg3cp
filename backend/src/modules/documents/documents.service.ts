import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Document, Prisma } from '@prisma/client';
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
import { CreateDocumentDto } from './dto/create-document.dto';
import { DOCUMENT_SORT, QueryDocumentDto } from './dto/query-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadProjectDocumentBodyDto } from './dto/upload-project-document.dto';
import { UploadObservationDocumentBodyDto } from './dto/upload-observation-document.dto';
import { UploadDecisionDocumentBodyDto } from './dto/upload-decision-document.dto';
import { UploadInterventionDocumentBodyDto } from './dto/upload-intervention-document.dto';
import { UploadPathologyDocumentBodyDto } from './dto/upload-pathology-document.dto';
import { UploadZoneDocumentBodyDto } from './dto/upload-zone-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    readonly cloudinaryPaths: CloudinaryPathBuilderService,
    private readonly cloudinaryUpload: CloudinaryUploadService,
  ) {}

  private orderBy(q: QueryDocumentDto): Prisma.DocumentOrderByWithRelationInput {
    const field =
      q.sortBy && DOCUMENT_SORT.includes(q.sortBy as (typeof DOCUMENT_SORT)[number])
        ? q.sortBy
        : 'createdAt';
    const dir = q.sortOrder === 'asc' ? 'asc' : 'desc';
    return { [field]: dir };
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

  async create(dto: CreateDocumentDto) {
    assertDocumentHasContext(dto);
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      return await this.prisma.document.create({
        data: {
          ...dto,
          authorName: dto.authorName?.trim() || undefined,
        },
      });
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async findAll(query: QueryDocumentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.DocumentWhereInput = {};
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
    if (query.search?.length) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { originalFilename: { contains: query.search, mode: 'insensitive' } },
        { publicId: { contains: query.search, mode: 'insensitive' } },
      ];
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
        },
      }),
    ]);
    return { data, meta: buildMeta(page, limit, total) };
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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
    const uploaded = await this.cloudinaryUpload.uploadDocumentBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      folder,
    );
    const originalFilename = (file.originalname || 'document').slice(0, 500);
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
          title,
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

  /** Titre affiché : dérivé uniquement du nom de fichier original. */
  private deriveDocumentTitle(originalFilename: string): string {
    const base = originalFilename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
    const cleaned = base.replace(/[_]+/g, ' ').trim();
    return (cleaned || originalFilename).slice(0, 500);
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

  async update(id: string, dto: UpdateDocumentDto) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document not found');
    assertDocumentHasContext(this.mergeContext(existing, dto));
    if (dto.authorActorId) await requireActor(this.prisma, dto.authorActorId);
    try {
      const { authorName, ...rest } = dto;
      return await this.prisma.document.update({
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
      await this.prisma.document.delete({ where: { id } });
    } catch (e) {
      handlePrismaError(e);
    }
    return { deleted: true, id };
  }
}
