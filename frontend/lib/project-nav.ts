/**
 * Project-scoped sidebar links: append `projectId` so URLs are shareable
 * and the selected project can be restored from the query string.
 */
export function withProjectQuery(path: string, projectId: string | null | undefined): string {
  if (!projectId?.trim()) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}projectId=${encodeURIComponent(projectId.trim())}`;
}

/** When no project is selected, project-scoped nav targets the project picker. */
export const PROJECT_PICKER_PATH = "/projects";
