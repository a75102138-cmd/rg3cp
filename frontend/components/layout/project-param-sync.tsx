"use client";

import { useProjectContext } from "@/providers/project-context";
import { useParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Syncs /projects/[projectId]/... route param into global project context.
 */
export function ProjectParamSync() {
  const params = useParams<{ projectId?: string; id?: string }>();
  const routeProjectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : typeof params?.id === "string"
        ? params.id
        : "";
  const { projectId, setProjectId, projects } = useProjectContext();

  useEffect(() => {
    if (!routeProjectId) return;
    const valid = projects.some((p) => p.id === routeProjectId);
    if (!valid) return;
    if (projectId === routeProjectId) return;
    setProjectId(routeProjectId);
  }, [routeProjectId, projects, projectId, setProjectId]);

  return null;
}
