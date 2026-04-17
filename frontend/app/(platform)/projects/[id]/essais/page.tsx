"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProjectEssaisSection } from "@/features/projects/project-essais-section";
import { projectsApi } from "@/lib/api/resources";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ProjectEssaisPage() {
  const params = useParams<{ id?: string }>();
  const routeProjectId = typeof params?.id === "string" ? params.id : "";
  const { projectId } = useProjectContext();
  const activeProjectId = routeProjectId || projectId;

  const projectQ = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => projectsApi.get(activeProjectId),
    enabled: Boolean(activeProjectId),
  });

  if (!activeProjectId || projectQ.isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }
  if (!projectQ.data) return null;

  return <ProjectEssaisSection projectId={activeProjectId} projectName={projectQ.data.name} />;
}
