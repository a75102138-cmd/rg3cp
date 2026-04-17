/** Libellés météo en français (valeurs API = enum Prisma). */

export const WEATHER_OPTIONS = [
  { value: "CLEAR", label: "Ensoleillé" },
  { value: "CLOUDY", label: "Nuageux" },
  { value: "RAIN", label: "Pluie" },
  { value: "WIND", label: "Vent" },
  { value: "FOG", label: "Brouillard" },
  { value: "OTHER", label: "Autre" },
] as const;

export function weatherLabelFr(v: string | null | undefined): string {
  if (v == null || v === "") return "—";
  const found = WEATHER_OPTIONS.find((o) => o.value === v);
  return found?.label ?? v.replaceAll("_", " ").toLowerCase();
}
