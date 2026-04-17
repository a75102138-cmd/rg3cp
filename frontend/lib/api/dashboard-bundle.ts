import {
  decisionsForZoneIds,
  interventionsForZoneIds,
  observationsForZoneIds,
} from "./project-scoped";
import {
  documentsApi,
  fetchAllPages,
  fetchAllZonesForProject,
  logbooksApi,
  photosApi,
  projectsApi,
} from "./resources";

export async function fetchDashboardBundle(projectId: string) {
  const [project, zones] = await Promise.all([
    projectsApi.get(projectId),
    fetchAllZonesForProject(projectId),
  ]);
  const zoneIds = zones.map((z) => z.id);

  const [observations, decisions, interventions, logbooks, photos, documents, riskFiles] =
    await Promise.all([
      zoneIds.length ? observationsForZoneIds(zoneIds) : Promise.resolve([]),
      zoneIds.length ? decisionsForZoneIds(zoneIds) : Promise.resolve([]),
      zoneIds.length ? interventionsForZoneIds(zoneIds) : Promise.resolve([]),
      fetchAllPages((p) => logbooksApi.list({ projectId, limit: 40, page: p })),
      fetchAllPages((p) => photosApi.list({ projectId, limit: 20, page: p })),
      fetchAllPages((p) => documentsApi.list({ projectId, limit: 50, page: p })),
      fetchAllPages((p) =>
        documentsApi.list({
          projectId,
          bddCategory: "BDD_SECURITE",
          limit: 50,
          page: p,
        }),
      ),
    ]);

  return {
    project,
    zones,
    observations,
    decisions,
    interventions,
    risks: riskFiles,
    logbooks,
    photos,
    documents,
  };
}
