import type { MainNavEntry } from "@/lib/nav";
import { PROJECT_PICKER_PATH } from "@/lib/project-nav";

function projectScopedPath(basePath: string, projectId: string): string {
  const map: Record<string, string> = {
    "/": "/dashboard",
    "/zones": "/zones",
    "/bdd-admin": "/bdd-admin",
    "/bdd-doctrine": "/bdd-doctrine",
    "/bdd-plans": "/bdd-plans",
    "/bdd-materiaux": "/bdd-materiaux",
    "/bdd-archeo": "/bdd-archeo",
    "/bdd-logbook": "/bdd-logbook",
    "/bdd-media": "/bdd-media",
    "/bdd-financier": "/bdd-financier",
    "/bdd-securite": "/bdd-securite",
    "/bdd-qualite": "/bdd-qualite",
    "/validation": "/validation",
  };
  const suffix = map[basePath] ?? basePath;
  return `/projects/${encodeURIComponent(projectId)}${suffix}`;
}

export function navHref(entry: MainNavEntry, projectId: string): string {
  if (entry.scope === "global") return entry.path;
  return projectId ? projectScopedPath(entry.path, projectId) : PROJECT_PICKER_PATH;
}

function extractProjectModule(pathname: string): string | null {
  const match = /^\/projects\/[^/]+(?:\/([^/?#]+))?/.exec(pathname);
  if (!match) return null;
  return match[1] ?? null;
}

export function isNavActive(pathname: string, entry: MainNavEntry): boolean {
  const projectModule = extractProjectModule(pathname);

  if (entry.path === "/projects") {
    return pathname === "/projects" || /^\/projects\/[^/]+$/.test(pathname);
  }

  const projectModuleByEntryPath: Record<string, string> = {
    "/": "dashboard",
    "/zones": "zones",
    "/bdd-admin": "bdd-admin",
    "/bdd-doctrine": "bdd-doctrine",
    "/bdd-plans": "bdd-plans",
    "/bdd-materiaux": "bdd-materiaux",
    "/bdd-archeo": "bdd-archeo",
    "/bdd-logbook": "bdd-logbook",
    "/bdd-media": "bdd-media",
    "/bdd-financier": "bdd-financier",
    "/bdd-securite": "bdd-securite",
    "/bdd-qualite": "bdd-qualite",
    "/validation": "validation",
  };
  const expectedModule = projectModuleByEntryPath[entry.path];

  if (projectModule && expectedModule) return projectModule === expectedModule;
  if (entry.path === "/") return pathname === "/";
  return pathname === entry.path || pathname.startsWith(`${entry.path}/`);
}
