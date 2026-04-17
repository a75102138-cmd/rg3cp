import type { Paginated } from "@/types/api";
import {
  decisionsApi,
  fetchAllPages,
  interventionsApi,
  labTestsApi,
  observationsApi,
  pathologiesApi,
} from "./resources";

export async function listForZones<T>(
  zoneIds: string[],
  fetchPage: (
    zoneId: string,
    page: number,
  ) => Promise<Paginated<T>>,
): Promise<T[]> {
  const out: T[] = [];
  for (const zoneId of zoneIds) {
    out.push(
      ...(await fetchAllPages(
        (page) => fetchPage(zoneId, page),
        100,
      )),
    );
  }
  return out;
}

/** Loads observations for all zones (parallel paginated per zone). */
export function observationsForZoneIds(zoneIds: string[]) {
  return listForZones(zoneIds, (zoneId, page) =>
    observationsApi.list({ zoneId, limit: 100, page }),
  );
}

export function decisionsForZoneIds(zoneIds: string[]) {
  return listForZones(zoneIds, (zoneId, page) =>
    decisionsApi.list({ zoneId, limit: 100, page }),
  );
}

export function interventionsForZoneIds(zoneIds: string[]) {
  return listForZones(zoneIds, (zoneId, page) =>
    interventionsApi.list({ zoneId, limit: 100, page }),
  );
}

export function pathologiesForZoneIds(zoneIds: string[]) {
  return listForZones(zoneIds, (zoneId, page) =>
    pathologiesApi.list({ zoneId, limit: 100, page }),
  );
}

export function labTestsForZoneIds(zoneIds: string[]) {
  return listForZones(zoneIds, (zoneId, page) =>
    labTestsApi.list({ zoneId, limit: 100, page }),
  );
}
