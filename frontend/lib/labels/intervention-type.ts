/** Libellés français pour les types d’intervention (valeurs API en anglais). */
export const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  CLEANING: "Nettoyage",
  CONSOLIDATION: "Consolidation",
  REPAIR: "Réparation",
  REPLACEMENT_PARTIAL: "Remplacement partiel",
  PROTECTION: "Protection",
  RE_INTEGRATION: "Réintégration",
  PROVISIONAL: "Provisoire",
  SURVEY: "Diagnostic / relevé",
  OTHER: "Autre",
};

export function interventionTypeLabel(type: string): string {
  return INTERVENTION_TYPE_LABELS[type] ?? type;
}
