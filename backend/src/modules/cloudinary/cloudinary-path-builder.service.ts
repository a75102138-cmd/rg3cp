import { Injectable } from '@nestjs/common';
import { FileKind } from '@prisma/client';

/**
 * Centralizes Cloudinary `folder` / `asset_folder` segments so uploads stay consistent.
 * Paths are string builders only — no SDK calls here (upload service comes later).
 *
 * Zone / observation / … paths use `projects/{projectCode}/...`.
 * **Documents globaux projet** : racine imposée `rg3cp/{projectCode}/documents/{typeSlug}`.
 */
@Injectable()
export class CloudinaryPathBuilderService {
  /** Dossier racine applicatif Cloudinary (existant côté compte). */
  static readonly PROJECT_DOCS_ROOT = 'rg3cp';

  /** Normalize a single path segment (no leading/trailing slashes). */
  private seg(value: string): string {
    return value.trim().replace(/^\/+|\/+$/g, '');
  }

  private projectRoot(projectCode: string): string {
    return `projects/${this.seg(projectCode)}`;
  }

  // --- Project-level (global project documents) — rg3cp ---
  projectDocumentsFolder(projectCode: string): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/documents`;
  }

  /** Image de couverture projet : `rg3cp/{projectCode}/cover` */
  projectCoverFolderRg3cp(projectCode: string): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/cover`;
  }

  /**
   * Documents projet : `rg3cp/{code}/documents/{typeSlug}`
   * (ex. rg3cp/PROJ-TINMEL-26/documents/rapport)
   */
  projectDocumentsFolderForType(projectCode: string, fileKind: FileKind): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }

  /** URL-safe slug for Cloudinary folder segment from FileKind. */
  fileKindSlug(fileKind: FileKind): string {
    const map: Record<FileKind, string> = {
      PHOTO: 'photo',
      SCAN: 'scan',
      REPORT: 'rapport',
      DRAWING: 'dessin',
      MINUTES_PV: 'pv',
      CONTRACT: 'contrat',
      LAB_REPORT: 'rapport-laboratoire',
      CERTIFICATE: 'certificat',
      CORRESPONDENCE: 'correspondance',
      OTHER: 'autre',
      CPS: 'cps',
      PLAN: 'plan',
      NOTE: 'note',
      FICHE_TECHNIQUE: 'fiche-technique',
      PLANNING: 'planning',
    };
    return map[fileKind] ?? 'autre';
  }

  projectPhotosFolder(projectCode: string): string {
    return `${this.projectRoot(projectCode)}/photos`;
  }

  /**
   * Photos globales projet : `rg3cp/{code}/photos/{typeSlug}`
   * (ex. rg3cp/PROJ-TINMEL-26/photos/vue-globale)
   */
  projectProjectPhotosFolderForType(projectCode: string, projectPhotoTypeKey: string): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/photos/${this.projectPhotoTypeSlug(projectPhotoTypeKey)}`;
  }

  /** Slug dossier Cloudinary pour le type métier photo projet (VUE_GLOBALE → vue-globale). */
  projectPhotoTypeSlug(projectPhotoTypeKey: string): string {
    const map: Record<string, string> = {
      VUE_GLOBALE: 'vue-globale',
      DRONE: 'drone',
      EVENEMENT: 'evenement',
      VISITE: 'visite',
      SUIVI_CHANTIER: 'suivi-chantier',
      INTEMPERIES: 'intemperies',
      AUTRE: 'autre',
    };
    const k = projectPhotoTypeKey?.trim().toUpperCase() ?? '';
    return map[k] ?? 'autre';
  }

  projectJournalFolder(projectCode: string): string {
    return `${this.projectRoot(projectCode)}/journal`;
  }

  /** Photos déposées depuis le journal de chantier (Cloudinary folder). */
  projectJournalPhotosFolder(projectCode: string): string {
    return `${this.projectJournalFolder(projectCode)}/photos`;
  }

  // --- Zone-level ---
  private zoneRoot(projectCode: string, zoneCode: string): string {
    return `${this.projectRoot(projectCode)}/zones/${this.seg(zoneCode)}`;
  }

  zoneDocumentsFolder(projectCode: string, zoneCode: string): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/documents`;
  }

  zonePhotosFolder(projectCode: string, zoneCode: string): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/photos`;
  }

  /**
   * Documents zone : `rg3cp/{projectCode}/zones/{zoneCode}/documents/{typeSlug}`
   * (ex. rg3cp/PROJ-XX/zones/TIN-Z-MIN/documents/rapport)
   */
  zoneDocumentsFolderForRg3cp(projectCode: string, zoneCode: string, fileKind: FileKind): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }

  /**
   * Photos zone par phase : `rg3cp/{projectCode}/zones/{zoneCode}/photos/{avant|pendant|apres}`
   */
  zonePhotosFolderForPhaseRg3cp(projectCode: string, zoneCode: string, phaseKey: string): string {
    const map: Record<string, string> = {
      AVANT: 'avant',
      PENDANT: 'pendant',
      APRES: 'apres',
    };
    const slug = map[phaseKey.trim().toUpperCase()] ?? 'autre';
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/photos/${slug}`;
  }

  /** General media bucket for a zone (non-photo assets if needed). */
  zoneMediaFolder(projectCode: string, zoneCode: string): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/media`;
  }

  // --- Observation-level ---
  private observationRoot(
    projectCode: string,
    zoneCode: string,
    observationCode: string,
    elementCode?: string | null,
  ): string {
    const elementSegment = elementCode?.trim()
      ? `/elements/${this.seg(elementCode)}`
      : '';
    return `${this.zoneRoot(projectCode, zoneCode)}${elementSegment}/observations/${this.seg(observationCode)}`;
  }

  observationPhotosFolder(
    projectCode: string,
    zoneCode: string,
    observationCode: string,
    elementCode?: string | null,
  ): string {
    return `${this.observationRoot(projectCode, zoneCode, observationCode, elementCode)}/photos`;
  }

  /** `rg3cp/{projectCode}/zones/{zoneCode}/observations/{observationCode}/photos` */
  observationPhotosFolderRg3cp(
    projectCode: string,
    zoneCode: string,
    observationCode: string,
    elementCode?: string | null,
  ): string {
    const elementSegment = elementCode?.trim()
      ? `/elements/${this.seg(elementCode)}`
      : '';
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}${elementSegment}/observations/${this.seg(observationCode)}/photos`;
  }

  observationDocumentsFolder(
    projectCode: string,
    zoneCode: string,
    observationCode: string,
    elementCode?: string | null,
  ): string {
    return `${this.observationRoot(projectCode, zoneCode, observationCode, elementCode)}/documents`;
  }

  /** `rg3cp/.../observations/{observationCode}/documents/{typeSlug}` (+ éléments/{elementCode} si présent). */
  observationDocumentsFolderForRg3cp(
    projectCode: string,
    zoneCode: string,
    observationCode: string,
    fileKind: FileKind,
    elementCode?: string | null,
  ): string {
    const elementSegment = elementCode?.trim()
      ? `/elements/${this.seg(elementCode)}`
      : '';
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}${elementSegment}/observations/${this.seg(observationCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }

  // --- Pathology-level ---
  private pathologyRoot(
    projectCode: string,
    zoneCode: string,
    pathologyCode: string,
  ): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/pathologies/${this.seg(pathologyCode)}`;
  }

  pathologyPhotosFolder(
    projectCode: string,
    zoneCode: string,
    pathologyCode: string,
  ): string {
    return `${this.pathologyRoot(projectCode, zoneCode, pathologyCode)}/photos`;
  }

  /** `rg3cp/.../pathologies/{pathologyCode}/photos` */
  pathologyPhotosFolderRg3cp(
    projectCode: string,
    zoneCode: string,
    pathologyCode: string,
  ): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/pathologies/${this.seg(pathologyCode)}/photos`;
  }

  pathologyDocumentsFolder(
    projectCode: string,
    zoneCode: string,
    pathologyCode: string,
  ): string {
    return `${this.pathologyRoot(projectCode, zoneCode, pathologyCode)}/documents`;
  }

  /** `rg3cp/.../pathologies/{pathologyCode}/documents/{typeSlug}` */
  pathologyDocumentsFolderForRg3cp(
    projectCode: string,
    zoneCode: string,
    pathologyCode: string,
    fileKind: FileKind,
  ): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/pathologies/${this.seg(pathologyCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }

  // --- Decision-level ---
  private decisionRoot(
    projectCode: string,
    zoneCode: string,
    decisionCode: string,
  ): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/decisions/${this.seg(decisionCode)}`;
  }

  decisionDocumentsFolder(
    projectCode: string,
    zoneCode: string,
    decisionCode: string,
  ): string {
    return `${this.decisionRoot(projectCode, zoneCode, decisionCode)}/documents`;
  }

  /** `rg3cp/.../decisions/{decisionCode}/documents/{typeSlug}` */
  decisionDocumentsFolderForRg3cp(
    projectCode: string,
    zoneCode: string,
    decisionCode: string,
    fileKind: FileKind,
  ): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/decisions/${this.seg(decisionCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }

  // --- Intervention-level ---
  private interventionRoot(
    projectCode: string,
    zoneCode: string,
    interventionCode: string,
  ): string {
    return `${this.zoneRoot(projectCode, zoneCode)}/interventions/${this.seg(interventionCode)}`;
  }

  interventionPhotosFolder(
    projectCode: string,
    zoneCode: string,
    interventionCode: string,
  ): string {
    return `${this.interventionRoot(projectCode, zoneCode, interventionCode)}/photos`;
  }

  interventionDocumentsFolder(
    projectCode: string,
    zoneCode: string,
    interventionCode: string,
  ): string {
    return `${this.interventionRoot(projectCode, zoneCode, interventionCode)}/documents`;
  }

  /** `rg3cp/.../interventions/{interventionCode}/photos` */
  interventionPhotosFolderRg3cp(
    projectCode: string,
    zoneCode: string,
    interventionCode: string,
  ): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/interventions/${this.seg(interventionCode)}/photos`;
  }

  /** `rg3cp/.../interventions/{interventionCode}/documents/{typeSlug}` */
  interventionDocumentsFolderForRg3cp(
    projectCode: string,
    zoneCode: string,
    interventionCode: string,
    fileKind: FileKind,
  ): string {
    return `${CloudinaryPathBuilderService.PROJECT_DOCS_ROOT}/${this.seg(projectCode)}/zones/${this.seg(zoneCode)}/interventions/${this.seg(interventionCode)}/documents/${this.fileKindSlug(fileKind)}`;
  }
}
