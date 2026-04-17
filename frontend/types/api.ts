/** Backend paginated list envelope */
export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ApiUserRole =
  | "ADMIN"
  | "USER"
  | "ACTEUR";

export type ApiUser = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ApiUserRole;
  status?: "INVITED" | "ACTIVE";
  defaultValidatorUserId?: string | null;
  defaultValidator?: Pick<ApiUser, "id" | "code" | "firstName" | "lastName" | "email" | "role"> | null;
  isActive: boolean;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  projectAssignments?: { projectId: string }[];
};

export type ApiDocumentRef = {
  id: string;
  title?: string | null;
  originalFilename?: string;
  fileKind?: string;
  secureUrl?: string;
  url?: string;
};

export type ApiActor = {
  id: string;
  code: string;
  name: string;
  organization?: string | null;
  role: string;
  email?: string | null;
  phone?: string | null;
  projectAssignments?: { projectId: string }[];
};

export type ApiProject = {
  id: string;
  code: string;
  name: string;
  location: string;
  startDate: string;
  plannedEndDate: string | null;
  status: string;
  imageUrl?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    zones: number;
    logbooks: number;
    documents: number;
    photos: number;
    risks: number;
    userAssignments: number;
    actorAssignments: number;
  };
};

export type ApiProjectAssignments = {
  id: string;
  userAssignments: {
    userId: string;
    user: Pick<ApiUser, "id" | "code" | "firstName" | "lastName" | "email" | "role" | "isActive">;
  }[];
  actorAssignments: {
    actorId: string;
    actor: Pick<ApiActor, "id" | "code" | "name" | "organization" | "role" | "email" | "phone">;
  }[];
};

export type ApiAdminOverview = {
  totals: {
    totalProjects: number;
    totalUsers: number;
    totalActors: number;
    totalDocuments: number;
    pendingDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
  };
  actors: Array<{
    id: string;
    code: string;
    name: string;
    organization?: string | null;
    role: string;
    email?: string | null;
    phone?: string | null;
    pendingDocuments: number;
    projectAssignments: Array<Pick<ApiProject, "id" | "code" | "name">>;
  }>;
  projects: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    documentsCount: number;
    pendingDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    usersCount: number;
    actorsCount: number;
  }>;
  pendingDocuments: Array<{
    id: string;
    title: string | null;
    originalFilename: string;
    createdAt: string;
    project: Pick<ApiProject, "id" | "code" | "name"> | null;
    assignedUsers: Array<{ id: string; name: string; role: ApiUserRole }>;
    responsibleActor: {
      id: string;
      code: string;
      name: string;
      organization?: string | null;
    } | null;
  }>;
};

export type ApiZone = {
  id: string;
  projectId: string;
  code: string;
  name: string;
  parentZoneId?: string | null;
  zoneType?: string;
  heritageSensitivity?: string | null;
  /** Couverture (Cloudinary `rg3cp/{projectCode}/zones/{zoneCode}/cover`). */
  imageUrl?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  project?: ApiProject | null;
  _count?: {
    observations: number;
    documents: number;
    photos: number;
    labTests: number;
    risks: number;
  };
};

export type ApiPhoto = {
  id: string;
  title?: string | null;
  caption?: string | null;
  photoType?: string | null;
  photoPhase?: string | null;
  originalFilename?: string;
  url?: string;
  secureUrl?: string;
  /** Date réelle de prise (EXIF / saisie), distincte de l’upload. */
  takenAt?: string | null;
  dateFolder?: string | null;
  category?: string;
  subCategory?: string | null;
  bddCategory?: string | null;
  tableName?: string | null;
  subFolder?: string | null;
  folderPath?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  scope?: "PROJECT" | "ZONE";
  uploadedById?: string | null;
  validatedById?: string | null;
  validatedAt?: string | null;
  remarks?: string | null;
  relatedZoneId?: string | null;
  createdAt?: string;
  authorActorId?: string | null;
  authorName?: string | null;
  authorActor?: ApiActor | null;
  projectId?: string | null;
  zoneId?: string | null;
  elementId?: string | null;
  observationId?: string | null;
  pathologyId?: string | null;
  interventionId?: string | null;
  logbookId?: string | null;
  zone?: ApiZone | null;
};

export type ApiElement = {
  id: string;
  zoneId: string;
  materialId: string | null;
  code: string;
  name: string;
  elementType: string;
  description: string | null;
  zone?: ApiZone;
  material?: ApiMaterial | null;
};

/** Réponse `GET /elements/:id` enrichie (zone + projet, photos, compteurs). */
export type ApiElementDetail = ApiElement & {
  zone?: ApiZone & { project?: ApiProject | null };
  photos?: ApiPhoto[];
  _count?: { observations: number; photos: number };
};

export type ApiObservation = {
  id: string;
  zoneId: string;
  elementId: string | null;
  authorActorId?: string | null;
  authorName?: string | null;
  code: string;
  title: string;
  observationType: string;
  severity: string | null;
  description: string | null;
  observedAt: string | null;
  zone?: ApiZone;
  element?: ApiElement | null;
  authorActor?: ApiActor | null;
};

export type ApiPathology = {
  id: string;
  zoneId: string;
  elementId: string | null;
  observationId: string | null;
  code: string;
  name: string;
  pathologyType: string;
  severity: string | null;
  description: string | null;
  zone?: ApiZone & { project?: ApiProject | null };
  element?: ApiElement | null;
  observation?: ApiObservation | null;
  photos?: ApiPhoto[];
  documents?: ApiDocument[];
  decisions?: ApiDecision[];
  interventions?: ApiIntervention[];
};

export type ApiObservationDetail = ApiObservation & {
  zone?: ApiZone & { project?: ApiProject | null };
  pathologies?: ApiPathology[];
  decisions?: ApiDecision[];
  documents?: ApiDocument[];
  photos?: ApiPhoto[];
};

export type ApiPathologyDetail = ApiPathology;

export type ApiDecisionDetail = ApiDecision & {
  zone?: ApiZone & { project?: ApiProject | null };
  observation?: (ApiObservation & { element?: ApiElement | null }) | null;
  documents?: ApiDocument[];
  interventions?: ApiIntervention[];
  risks?: ApiRisk[];
};

export type ApiDecision = {
  id: string;
  zoneId: string;
  observationId: string | null;
  pathologyId: string | null;
  authorName?: string | null;
  pvDocumentId: string | null;
  code: string;
  title: string;
  decisionType: string;
  status: string;
  description: string | null;
  justification: string | null;
  doctrinalPrinciples: string | null;
  decidedAt: string | null;
  zone?: ApiZone;
  observation?: ApiObservation | null;
  pathology?: { id: string; code: string; pathologyType?: string } | null;
  pvDocument?: ApiDocumentRef | null;
};

export type ApiIntervention = {
  id: string;
  decisionId: string;
  zoneId: string;
  elementId: string | null;
  pathologyId: string | null;
  companyActorId?: string | null;
  companyName?: string | null;
  code: string;
  interventionType: string;
  status: string;
  description: string | null;
  /** Date métier chantier (distincte du planning / upload). */
  eventDate?: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  zone?: ApiZone;
  decision?: ApiDecision;
  companyActor?: ApiActor | null;
};

export type ApiInterventionDetail = ApiIntervention & {
  zone?: ApiZone & { project?: ApiProject | null };
  element?: ApiElement | null;
  pathology?: { id: string; code: string; pathologyType?: string } | null;
  decision?: ApiDecision & {
    zone?: ApiZone & { project?: ApiProject | null };
    observation?: (ApiObservation & { element?: ApiElement | null }) | null;
    pathology?: { id: string; code: string; pathologyType?: string } | null;
    pvDocument?: ApiDocumentRef | null;
  };
  documents?: ApiDocument[];
  photos?: ApiPhoto[];
  risks?: ApiRisk[];
};

export type ApiDocument = {
  id: string;
  title: string | null;
  fileKind?: string;
  originalFilename?: string;
  mimeType?: string;
  format?: string | null;
  url?: string;
  secureUrl?: string;
  /** Date métier du document, distincte de l’upload. */
  documentDate?: string | null;
  category?: string;
  subCategory?: string | null;
  bddCategory?: string | null;
  tableName?: string | null;
  subFolder?: string | null;
  folderPath?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  scope?: "PROJECT" | "ZONE";
  uploadedById?: string | null;
  validatedById?: string | null;
  uploadedBy?: Pick<ApiUser, "id" | "firstName" | "lastName" | "email"> | null;
  validatedBy?: Pick<ApiUser, "id" | "firstName" | "lastName" | "email"> | null;
  validatedAt?: string | null;
  remarks?: string | null;
  relatedZoneId?: string | null;
  createdAt?: string;
  authorActorId?: string | null;
  authorName?: string | null;
  authorActor?: ApiActor | null;
  projectId?: string | null;
  zoneId?: string | null;
  observationId?: string | null;
  pathologyId?: string | null;
  decisionId?: string | null;
  interventionId?: string | null;
  logbookId?: string | null;
  zone?: ApiZone | null;
};

export type ApiLogbook = {
  id: string;
  projectId?: string;
  code: string;
  title: string;
  eventAt?: string | null;
  description?: string | null;
  weather?: string | null;
  workforce?: number | null;
  authorActorId?: string | null;
  authorName?: string | null;
  authorActor?: ApiActor | null;
  createdAt?: string;
  updatedAt?: string;
  project?: ApiProject | null;
  decisionLinks?: { decision: ApiDecision; note?: string | null }[];
  interventionLinks?: { intervention: ApiIntervention; note?: string | null }[];
  _count?: {
    decisionLinks?: number;
    interventionLinks?: number;
  };
};

export type ApiRisk = {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  riskCategory: string;
  probability?: string | null;
  impact?: string | null;
  status?: string;
  mitigation?: string | null;
  ownerName?: string | null;
  projectId?: string | null;
  zoneId?: string | null;
  decisionId?: string | null;
  interventionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  zone?: { id: string; name: string; code: string } | null;
  decision?: { id: string; code: string; title: string } | null;
};

export type ApiMaterial = {
  id: string;
  code: string;
  name: string;
  type: string;
  origin?: string | null;
  compatibility?: string | null;
  _count?: { elements?: number; labTests?: number };
};

export type ApiLabTest = {
  id: string;
  zoneId: string;
  materialId: string | null;
  laboratoryActorId?: string | null;
  laboratoryName?: string | null;
  documentId: string | null;
  code: string;
  labTestType: string;
  result?: string | null;
  testedAt?: string | null;
  createdAt?: string;
  zone?: ApiZone;
  material?: ApiMaterial | null;
  laboratoryActor?: ApiActor | null;
  reportDocument?: ApiDocumentRef | null;
};
