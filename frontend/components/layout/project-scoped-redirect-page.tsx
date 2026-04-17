"use client";

import { useProjectContext } from "@/providers/project-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  section: "zones" | "media" | "documents" | "journal" | "risques" | "essais";
};

export function ProjectScopedRedirectPage({ section }: Props) {
  const router = useRouter();
  const { projectId, isProjectsListLoading } = useProjectContext();

  useEffect(() => {
    if (isProjectsListLoading) return;
    if (!projectId) {
      router.replace("/projects");
      return;
    }
    router.replace(`/projects/${projectId}/${section}`);
  }, [isProjectsListLoading, projectId, router, section]);

  return null;
}
