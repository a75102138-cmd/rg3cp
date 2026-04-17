import type { ApiDocument, ApiPhoto } from "@/types/api";

/** Date « métier » pour une photo : prise réelle, sinon date d’upload. */
export function effectivePhotoDateIso(photo: ApiPhoto): string | undefined {
  return photo.takenAt || photo.createdAt;
}

/** Date « métier » pour un document : date document, sinon upload. */
export function effectiveDocumentDateIso(doc: ApiDocument): string | undefined {
  return doc.documentDate || doc.createdAt;
}

export function comparePhotosByEffectiveDateDesc(a: ApiPhoto, b: ApiPhoto): number {
  const ta = new Date(effectivePhotoDateIso(a) ?? 0).getTime();
  const tb = new Date(effectivePhotoDateIso(b) ?? 0).getTime();
  return tb - ta;
}

/** Regroupe par jour calendaire (clé ISO yyyy-mm-dd), ordre décroissant. */
export function groupPhotosByDay(
  photos: ApiPhoto[],
): { dayKey: string; label: string; items: ApiPhoto[] }[] {
  const sorted = [...photos].sort(comparePhotosByEffectiveDateDesc);
  const map = new Map<string, ApiPhoto[]>();
  for (const p of sorted) {
    const iso = effectivePhotoDateIso(p);
    const d = iso ? new Date(iso) : new Date();
    const key = d.toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKey, items]) => ({
      dayKey,
      label: new Date(dayKey + "T12:00:00").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      items,
    }));
}

export type DatePreset = "today" | "week" | "month";

/** Plage [from, to] en fin de journée locale, pour filtrer côté client. */
export function clientRangeFromPreset(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  if (preset === "today") {
    return { from, to };
  }
  if (preset === "week") {
    const day = from.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    from.setDate(from.getDate() + diff);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  from.setDate(1);
  from.setMonth(now.getMonth());
  from.setFullYear(now.getFullYear());
  from.setHours(0, 0, 0, 0);
  return { from, to };
}
