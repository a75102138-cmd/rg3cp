export const DOCTRINAL_PRINCIPLES_OPTIONS = [
  "Lisibilité",
  "Réversibilité",
  "Intervention minimale",
  "Authenticité",
  "Compatibilité des matériaux",
  "Conservation de la substance historique",
  "Distinguabilité",
  "Documentation préalable",
  "Stabilité structurelle",
  "Respect des techniques traditionnelles",
] as const;

export function parseDoctrinalPrinciples(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\n|,|\|/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function stringifyDoctrinalPrinciples(values: string[]): string {
  return values.join(" | ");
}
