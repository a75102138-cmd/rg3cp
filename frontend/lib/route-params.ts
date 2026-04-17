/**
 * Segment dynamique App Router (`[id]`, etc.) : `useParams()` peut exposer string ou string[].
 */
export function segmentIdFromParams(
  params: Readonly<Record<string, string | string[] | undefined>>,
  key = "id",
): string {
  const raw = params[key];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && raw[0]) return String(raw[0]).trim();
  return "";
}
