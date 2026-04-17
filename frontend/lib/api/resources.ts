import type {
  ApiActor,
  ApiAdminOverview,
  ApiUser,
  ApiDecision,
  ApiDecisionDetail,
  ApiDocument,
  ApiElement,
  ApiIntervention,
  ApiInterventionDetail,
  ApiLabTest,
  ApiLogbook,
  ApiMaterial,
  ApiObservation,
  ApiObservationDetail,
  ApiPathology,
  ApiPathologyDetail,
  ApiPhoto,
  ApiProject,
  ApiProjectAssignments,
  ApiRisk,
  ApiZone,
  Paginated,
} from "@/types/api";
import { apiFetch, apiFetchMultipart, buildQuery } from "./client";

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { firstName: string; lastName: string; email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyInvitation: (body: { token: string }) =>
    apiFetch<{ firstName: string; lastName: string; email: string; expiresAt: string }>(
      "/auth/invitations/verify",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  acceptInvitation: (body: { token: string; password: string }) =>
    apiFetch<{ success: boolean }>("/auth/invitations/accept", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => apiFetch<ApiUser>("/auth/me"),
};

export const usersApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiUser>>(`/users${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiUser>(`/users/${id}`),
  getProjects: (id: string) => apiFetch<ApiProject[]>(`/users/${id}/projects`),
  create: (body: object) =>
    apiFetch<ApiUser>("/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updateProjects: (id: string, body: { projectIds?: string[] }) =>
    apiFetch<ApiProject[]>(`/users/${id}/projects`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE", skipJson: true }),
};

export const actorsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiActor>>(`/actors${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiActor>(`/actors/${id}`),
  getProjects: (id: string) => apiFetch<ApiProject[]>(`/actors/${id}/projects`),
  create: (body: object) =>
    apiFetch<ApiActor>("/actors", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiActor>(`/actors/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updateProjects: (id: string, body: { projectIds?: string[] }) =>
    apiFetch<ApiProject[]>(`/actors/${id}/projects`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => apiFetch<void>(`/actors/${id}`, { method: "DELETE", skipJson: true }),
};

export const projectsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiProject>>(`/projects${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiProject>(`/projects/${id}`),
  create: (body: object) =>
    apiFetch<ApiProject>("/projects", { method: "POST", body: JSON.stringify(body) }),
  uploadCover: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetchMultipart<ApiProject>(`/projects/${projectId}/cover`, fd);
  },
  update: (id: string, body: object) =>
    apiFetch<ApiProject>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getAssignments: (id: string) =>
    apiFetch<ApiProjectAssignments>(`/projects/${id}/assignments`),
  updateAssignments: (id: string, body: { userIds?: string[]; actorIds?: string[] }) =>
    apiFetch<ApiProjectAssignments>(`/projects/${id}/assignments`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => apiFetch<void>(`/projects/${id}`, { method: "DELETE", skipJson: true }),
};

export const adminApi = {
  overview: () => apiFetch<ApiAdminOverview>("/admin/overview"),
};

export const zonesApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiZone>>(`/zones${buildQuery(params ?? {})}`),
  get: (id: string) =>
    apiFetch<ApiZone>(`/zones/${id}`),
  create: (body: object) =>
    apiFetch<ApiZone>("/zones", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiZone>(`/zones/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** Couverture → Cloudinary `rg3cp/{projectCode}/zones/{zoneCode}/cover` */
  uploadCover: (zoneId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetchMultipart<ApiZone>(`/zones/${zoneId}/cover`, fd);
  },
  remove: (id: string) =>
    apiFetch<void>(`/zones/${id}`, { method: "DELETE", skipJson: true }),
};

export const materialsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiMaterial>>(`/materials${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiMaterial>(`/materials/${id}`),
  create: (body: object) =>
    apiFetch<ApiMaterial>("/materials", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiMaterial>(`/materials/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/materials/${id}`, { method: "DELETE", skipJson: true }),
};

export const elementsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiElement>>(`/elements${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiElement>(`/elements/${id}`),
  create: (body: object) =>
    apiFetch<ApiElement>("/elements", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiElement>(`/elements/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/elements/${id}`, { method: "DELETE", skipJson: true }),
};

export const labTestsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiLabTest>>(`/lab-tests${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiLabTest>(`/lab-tests/${id}`),
  create: (body: object) =>
    apiFetch<ApiLabTest>("/lab-tests", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiLabTest>(`/lab-tests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/lab-tests/${id}`, { method: "DELETE", skipJson: true }),
};

export const observationsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiObservation>>(`/observations${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiObservationDetail>(`/observations/${id}`),
  create: (body: object) =>
    apiFetch<ApiObservation>("/observations", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiObservation>(`/observations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/observations/${id}`, { method: "DELETE", skipJson: true }),
};

export const pathologiesApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiPathology>>(`/pathologies${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiPathologyDetail>(`/pathologies/${id}`),
  create: (body: object) =>
    apiFetch<ApiPathology>("/pathologies", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiPathology>(`/pathologies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/pathologies/${id}`, { method: "DELETE", skipJson: true }),
};

export const decisionsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiDecision>>(`/decisions${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiDecisionDetail>(`/decisions/${id}`),
  create: (body: object) =>
    apiFetch<ApiDecision>("/decisions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiDecision>(`/decisions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/decisions/${id}`, { method: "DELETE", skipJson: true }),
};

export const interventionsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiIntervention>>(`/interventions${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiInterventionDetail>(`/interventions/${id}`),
  create: (body: object) =>
    apiFetch<ApiIntervention>("/interventions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiIntervention>(`/interventions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/interventions/${id}`, { method: "DELETE", skipJson: true }),
};

export const documentsApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiDocument>>(`/documents${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiDocument>(`/documents/${id}`),
  download: (id: string) => apiFetch<{ url: string }>(`/documents/${id}/download`),
  update: (id: string, body: object) =>
    apiFetch<ApiDocument>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  approve: (id: string, remarks?: string) =>
    apiFetch<ApiDocument>(`/documents/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),
  reject: (id: string, remarks?: string) =>
    apiFetch<ApiDocument>(`/documents/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),
  remove: (id: string) =>
    apiFetch<void>(`/documents/${id}`, { method: "DELETE", skipJson: true }),
  uploadUnified: (
    files: File[],
    body: {
      projectId: string;
      fileKind: string;
      category: string;
      subCategory?: string;
      bddCategory?: string;
      tableName?: string;
      subFolder?: string;
      folderPath?: string;
      scope: "PROJECT" | "ZONE";
      relatedZoneId?: string;
      documentDate?: string;
    },
  ) => {
    const fd = new FormData();
    fd.append("projectId", body.projectId);
    fd.append("fileKind", body.fileKind);
    fd.append("category", body.category);
    fd.append("scope", body.scope);
    if (body.subCategory?.trim()) fd.append("subCategory", body.subCategory.trim());
    if (body.bddCategory?.trim()) fd.append("bddCategory", body.bddCategory.trim());
    if (body.tableName?.trim()) fd.append("tableName", body.tableName.trim());
    if (body.subFolder?.trim()) fd.append("subFolder", body.subFolder.trim());
    if (body.folderPath?.trim()) fd.append("folderPath", body.folderPath.trim());
    if (body.relatedZoneId) fd.append("relatedZoneId", body.relatedZoneId);
    if (body.documentDate?.trim()) fd.append("documentDate", body.documentDate.trim());
    for (const f of files) fd.append("files", f);
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload", fd);
  },
  /** Upload projet batch → Cloudinary `rg3cp/{code}/documents/{type}` */
  uploadProject: (
    files: File[],
    projectId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/project", fd);
  },
  /** Upload zone batch → `rg3cp/{code}/zones/{zone}/documents/{type}` */
  uploadZone: (
    files: File[],
    zoneId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("zoneId", zoneId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/zone", fd);
  },
  uploadPathology: (
    files: File[],
    pathologyId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("pathologyId", pathologyId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/pathology", fd);
  },
  uploadDecision: (
    files: File[],
    decisionId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("decisionId", decisionId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/decision", fd);
  },
  uploadIntervention: (
    files: File[],
    interventionId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("interventionId", interventionId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/intervention", fd);
  },
  uploadObservation: (
    files: File[],
    observationId: string,
    fileKind: string,
    opts?: { documentDate?: string },
  ) => {
    const fd = new FormData();
    fd.append("observationId", observationId);
    fd.append("fileKind", fileKind);
    if (opts?.documentDate?.trim()) fd.append("documentDate", opts.documentDate.trim());
    for (const file of files) {
      fd.append("files", file);
    }
    return apiFetchMultipart<{ data: ApiDocument[] }>("/documents/upload/observation", fd);
  },
};

export const logbooksApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiLogbook>>(`/logbooks${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiLogbook>(`/logbooks/${id}`),
  create: (body: object) =>
    apiFetch<ApiLogbook>("/logbooks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiLogbook>(`/logbooks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/logbooks/${id}`, { method: "DELETE", skipJson: true }),
};

export const photosApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiPhoto>>(`/photos${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiPhoto>(`/photos/${id}`),
  download: (id: string) => apiFetch<{ url: string }>(`/photos/${id}/download`),
  update: (id: string, body: object) =>
    apiFetch<ApiPhoto>(`/photos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  approve: (id: string, remarks?: string) =>
    apiFetch<ApiPhoto>(`/photos/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),
  reject: (id: string, remarks?: string) =>
    apiFetch<ApiPhoto>(`/photos/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),
  remove: (id: string) => apiFetch<void>(`/photos/${id}`, { method: "DELETE", skipJson: true }),
  uploadUnified: (
    files: File[],
    body: {
      projectId: string;
      bddCategory: string;
      tableName: string;
      subFolder: string;
      folderPath?: string;
      category: string;
      subCategory?: string;
      scope: "PROJECT" | "ZONE";
      relatedZoneId?: string;
      takenAt?: string;
      title?: string;
      caption?: string;
    },
  ) => {
    const fd = new FormData();
    fd.append("projectId", body.projectId);
    fd.append("bddCategory", body.bddCategory);
    fd.append("tableName", body.tableName);
    fd.append("subFolder", body.subFolder);
    if (body.folderPath?.trim()) fd.append("folderPath", body.folderPath.trim());
    fd.append("category", body.category);
    fd.append("scope", body.scope);
    if (body.subCategory?.trim()) fd.append("subCategory", body.subCategory.trim());
    if (body.relatedZoneId) fd.append("relatedZoneId", body.relatedZoneId);
    if (body.takenAt?.trim()) fd.append("takenAt", body.takenAt.trim());
    if (body.title?.trim()) fd.append("title", body.title.trim());
    if (body.caption?.trim()) fd.append("caption", body.caption.trim());
    for (const f of files) fd.append("files", f);
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload", fd);
  },
  /** Upload images Cloudinary → `rg3cp/{code}/photos/{type}`, liées au projet seul. */
  uploadProject: (
    files: File[],
    projectId: string,
    photoType: string,
    opts?: { title?: string; caption?: string; takenAt?: string },
  ) => {
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("photoType", photoType);
    if (opts?.title?.trim()) fd.append("title", opts.title.trim());
    if (opts?.caption?.trim()) fd.append("caption", opts.caption.trim());
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/project", fd);
  },
  /** Upload images Cloudinary → dossier projet/journal/photos, liées au journal. */
  uploadJournal: (
    files: File[],
    projectId: string,
    logbookId: string,
    opts?: { takenAt?: string },
  ) => {
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("logbookId", logbookId);
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/journal", fd);
  },
  /** Photos zone → `rg3cp/{code}/zones/{zone}/photos/{phase}` */
  uploadZone: (
    files: File[],
    zoneId: string,
    photoPhase: string,
    photoType: string,
    opts?: { title?: string; caption?: string; takenAt?: string },
  ) => {
    const fd = new FormData();
    fd.append("zoneId", zoneId);
    fd.append("photoPhase", photoPhase);
    fd.append("photoType", photoType);
    if (opts?.title?.trim()) fd.append("title", opts.title.trim());
    if (opts?.caption?.trim()) fd.append("caption", opts.caption.trim());
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/zone", fd);
  },
  /** `rg3cp/.../observations/{code}/photos` */
  uploadObservation: (
    files: File[],
    observationId: string,
    photoPhase: string,
    photoType: string,
    opts?: { title?: string; caption?: string; takenAt?: string },
  ) => {
    const fd = new FormData();
    fd.append("observationId", observationId);
    fd.append("photoPhase", photoPhase);
    fd.append("photoType", photoType);
    if (opts?.title?.trim()) fd.append("title", opts.title.trim());
    if (opts?.caption?.trim()) fd.append("caption", opts.caption.trim());
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/observation", fd);
  },
  /** `rg3cp/.../pathologies/{code}/photos` */
  uploadPathology: (
    files: File[],
    pathologyId: string,
    opts?: {
      photoType?: string;
      photoPhase?: string;
      title?: string;
      caption?: string;
      takenAt?: string;
    },
  ) => {
    const fd = new FormData();
    fd.append("pathologyId", pathologyId);
    const pt = opts?.photoType?.trim();
    if (pt) fd.append("photoType", pt);
    if (opts?.photoPhase?.trim()) fd.append("photoPhase", opts.photoPhase.trim());
    if (opts?.title?.trim()) fd.append("title", opts.title.trim());
    if (opts?.caption?.trim()) fd.append("caption", opts.caption.trim());
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/pathology", fd);
  },
  /** `rg3cp/.../interventions/{code}/photos` */
  uploadIntervention: (
    files: File[],
    interventionId: string,
    opts?: {
      photoType?: string;
      photoPhase?: string;
      title?: string;
      caption?: string;
      takenAt?: string;
    },
  ) => {
    const fd = new FormData();
    fd.append("interventionId", interventionId);
    const pt = opts?.photoType?.trim();
    if (pt) fd.append("photoType", pt);
    if (opts?.photoPhase?.trim()) fd.append("photoPhase", opts.photoPhase.trim());
    if (opts?.title?.trim()) fd.append("title", opts.title.trim());
    if (opts?.caption?.trim()) fd.append("caption", opts.caption.trim());
    if (opts?.takenAt?.trim()) fd.append("takenAt", opts.takenAt.trim());
    for (const f of files) {
      fd.append("files", f);
    }
    return apiFetchMultipart<{ data: ApiPhoto[] }>("/photos/upload/intervention", fd);
  },
};

export const mediaApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiPhoto>>(`/media${buildQuery(params ?? {})}`),
};

export const risksApi = {
  list: (params?: Record<string, string | number | undefined | null>) =>
    apiFetch<Paginated<ApiRisk>>(`/risks${buildQuery(params ?? {})}`),
  get: (id: string) => apiFetch<ApiRisk>(`/risks/${id}`),
  create: (body: object) =>
    apiFetch<ApiRisk>("/risks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object) =>
    apiFetch<ApiRisk>(`/risks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<void>(`/risks/${id}`, { method: "DELETE", skipJson: true }),
};

/** Fetch all pages for modest datasets (filters reduce volume). */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
  maxPages = 20,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchPage(page);
    out.push(...res.data);
    totalPages = res.meta.totalPages;
    page += 1;
  } while (page <= totalPages && page <= maxPages);
  return out;
}

/** Limite alignée sur BaseListQueryDto côté Nest (@Max(100)). */
const API_LIST_PAGE_MAX = 100;

/** Toutes les entrées de journal d’un projet (pagination client). */
export async function fetchAllLogbooksForProject(projectId: string): Promise<ApiLogbook[]> {
  return fetchAllPages((page) =>
    logbooksApi.list({ projectId, limit: API_LIST_PAGE_MAX, page }),
  );
}

/** Tous les documents liés à un projet (pagination client). */
export async function fetchAllDocumentsForProject(projectId: string): Promise<ApiDocument[]> {
  return fetchAllPages((page) =>
    documentsApi.list({ projectId, limit: API_LIST_PAGE_MAX, page }),
  );
}

/** Photos du projet (sélection journal, etc.). */
export async function fetchAllPhotosForProject(projectId: string): Promise<ApiPhoto[]> {
  return fetchAllPages((page) =>
    photosApi.list({ projectId, limit: API_LIST_PAGE_MAX, page }),
  );
}

/**
 * Toutes les zones d’un projet (pagination automatique côté client).
 * Ne pas utiliser limit > 100 sur zonesApi.list seul : le backend renvoie 400.
 */
export async function fetchAllZonesForProject(projectId: string): Promise<ApiZone[]> {
  return fetchAllPages((page) =>
    zonesApi.list({ projectId, limit: API_LIST_PAGE_MAX, page }),
  );
}

/** Même données qu’en Paginated, pour les useQuery qui lisent `data.data`. */
export async function fetchZonesForProjectAsPaginated(
  projectId: string,
): Promise<Paginated<ApiZone>> {
  const data = await fetchAllZonesForProject(projectId);
  const total = data.length;
  return {
    data,
    meta: {
      page: 1,
      limit: Math.max(total, 1),
      total,
      totalPages: 1,
    },
  };
}
