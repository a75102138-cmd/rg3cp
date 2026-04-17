"use client";

import { useProjectContext } from "@/providers/project-context";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Reads `?projectId=` from the URL and applies it to global project context
 * when it matches a known project (deep links / sidebar links).
 */
export function ProjectUrlSync() {
  const params = useSearchParams();
  const { projectId, setProjectId, projects } = useProjectContext();
  const fromUrl = params.get("projectId");
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fromUrl) {
      appliedRef.current = null;
      return;
    }
    const valid = projects.some((p) => p.id === fromUrl);
    if (!valid) return;
    if (fromUrl === projectId) {
      appliedRef.current = fromUrl;
      return;
    }
    if (appliedRef.current === fromUrl) return;
    appliedRef.current = fromUrl;
    setProjectId(fromUrl);
  }, [fromUrl, projectId, projects, setProjectId]);

  return null;
}
