/** Map backend enum strings to StatusBadge keys (snake_case lower). */
export function toBadgeStatus(raw: string): string {
  const s = raw.trim().toLowerCase();
  return s.replace(/-/g, "_");
}

/** Map observation/decision severity from API */
export function toSeverityUi(
  raw: string | null | undefined,
): "info" | "low" | "medium" | "high" | "critical" {
  if (!raw) return "info";
  const k = raw.toLowerCase();
  if (k === "low") return "low";
  if (k === "medium") return "medium";
  if (k === "high") return "high";
  if (k === "critical") return "critical";
  return "info";
}

export function toHeritageUi(
  raw: string | null | undefined,
): "low" | "medium" | "high" | "critical" | null {
  if (!raw) return null;
  const k = raw.toLowerCase();
  if (k === "low") return "low";
  if (k === "medium") return "medium";
  if (k === "high") return "high";
  if (k === "critical") return "critical";
  if (k === "exceptional") return "critical";
  return null;
}
