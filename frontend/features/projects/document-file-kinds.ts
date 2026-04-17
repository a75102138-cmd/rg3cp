/** Valeurs Prisma `FileKind` pour documents projet — libellés FR + slug dossier Cloudinary alignés backend. */
export const PROJECT_DOCUMENT_TYPE_OPTIONS = [
  { value: "REPORT", label: "Rapport" },
  { value: "MINUTES_PV", label: "PV" },
  { value: "PLAN", label: "Plan" },
  { value: "CONTRACT", label: "Contrat" },
  { value: "CPS", label: "CPS" },
  { value: "NOTE", label: "Note" },
  { value: "FICHE_TECHNIQUE", label: "Fiche technique" },
  { value: "PLANNING", label: "Planning" },
  { value: "OTHER", label: "Autre" },
] as const;

export function labelForFileKind(kind: string | null | undefined): string {
  if (!kind) return "—";
  const found = PROJECT_DOCUMENT_TYPE_OPTIONS.find((o) => o.value === kind);
  if (found) return found.label;
  return kind.replaceAll("_", " ").toLowerCase();
}
