import type { ApiZone } from "@/types/api";
import type { Zone, ZoneType } from "@/types/domain";
import { toHeritageUi } from "@/lib/api/badge";
import { formatZoneSpatialTypeFr } from "@/lib/zone-spatial";

/** Carte approximative vers le modèle domaine « arbre » legacy (mock). */
const ZONE_TYPE_MAP: Record<string, ZoneType> = {
  WALL: "facade",
  ARCADE: "facade",
  TALUS: "structural",
  MUSEUM: "ensemble",
  COLUMN: "structural",
  PERIPHERAL_WALL: "facade",
  ROOM: "interior",
  SECTION: "ensemble",
  OTHER: "ensemble",
};

/** Libellé français pour un type spatial de zone (API). */
export function formatZoneType(zoneType: string): string {
  return formatZoneSpatialTypeFr(zoneType);
}

export function apiZoneToTreeZone(z: ApiZone): Zone {
  return {
    id: z.id,
    projectId: z.projectId,
    name: z.name,
    code: z.code,
    parentZoneId: z.parentZoneId ?? null,
    type: z.zoneType ? (ZONE_TYPE_MAP[z.zoneType] ?? "ensemble") : "ensemble",
    heritageSensitivity: toHeritageUi(z.heritageSensitivity ?? null),
    status: "monitoring",
    description: z.description ?? "",
    referencePlan: "—",
    thumbnail: "",
    mapRef: "—",
    counts: {
      observations: 0,
      pathologies: 0,
      interventions: 0,
      documents: 0,
      media: 0,
      elements: 0,
    },
  };
}
