/** Types métier API (`photoType`) — libellés FR. */
export const PROJECT_PHOTO_TYPE_OPTIONS = [
  { value: "VUE_GLOBALE", label: "Vue globale" },
  { value: "DRONE", label: "Drone" },
  { value: "EVENEMENT", label: "Événement" },
  { value: "VISITE", label: "Visite" },
  { value: "SUIVI_CHANTIER", label: "Suivi chantier" },
  { value: "INTEMPERIES", label: "Intempéries" },
  { value: "AUTRE", label: "Autre" },
] as const;

export function labelForProjectPhotoType(type: string | null | undefined): string {
  if (!type) return "—";
  const found = PROJECT_PHOTO_TYPE_OPTIONS.find((o) => o.value === type);
  if (found) return found.label;
  return type.replaceAll("_", " ").toLowerCase();
}
