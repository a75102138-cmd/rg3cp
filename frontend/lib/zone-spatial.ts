/**
 * Types spatiaux Zone (API) + libellés français pour l’interface.
 * Les valeurs envoyées au backend restent en anglais (enum Prisma).
 */

export const ZONE_SPATIAL_TYPES = [
  "WALL",
  "ARCADE",
  "TALUS",
  "MUSEUM",
  "COLUMN",
  "PERIPHERAL_WALL",
  "ROOM",
  "SECTION",
  "OTHER",
] as const;

export type ZoneSpatialTypeApi = (typeof ZONE_SPATIAL_TYPES)[number];

export const ZONE_SPATIAL_LABELS_FR: Record<ZoneSpatialTypeApi, string> = {
  WALL: "Mur",
  ARCADE: "Arcade",
  TALUS: "Talus",
  MUSEUM: "Musée",
  COLUMN: "Colonne",
  PERIPHERAL_WALL: "Mur périphérique",
  ROOM: "Salle",
  SECTION: "Section",
  OTHER: "Autre",
};

export function formatZoneSpatialTypeFr(value: string): string {
  if ((ZONE_SPATIAL_TYPES as readonly string[]).includes(value)) {
    return ZONE_SPATIAL_LABELS_FR[value as ZoneSpatialTypeApi];
  }
  return value;
}

/** @deprecated Utiliser `formatZoneSpatialTypeFr` — alias pour migrations d’import. */
export const formatZoneType = formatZoneSpatialTypeFr;
