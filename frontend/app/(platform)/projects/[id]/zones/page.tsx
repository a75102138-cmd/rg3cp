"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProjectZonesSection } from "@/features/projects/project-zones-section";
import { fetchZonesForProjectAsPaginated, projectsApi } from "@/lib/api/resources";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ProjectZonesPage() {
  const params = useParams<{ id?: string }>();
  const routeProjectId = typeof params?.id === "string" ? params.id : "";
  const { projectId } = useProjectContext();
  const activeProjectId = routeProjectId || projectId;

  const projectQ = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => projectsApi.get(activeProjectId),
    enabled: Boolean(activeProjectId),
  });
  const zonesQ = useQuery({
    queryKey: ["zones", "by-project", activeProjectId],
    queryFn: () => fetchZonesForProjectAsPaginated(activeProjectId),
    enabled: Boolean(activeProjectId),
  });

  if (!activeProjectId || projectQ.isLoading || zonesQ.isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }
  if (!projectQ.data) return null;

  return (
    <ProjectZonesSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      zones={zonesQ.data?.data ?? []}
      isLoading={zonesQ.isLoading}
      isError={zonesQ.isError}
    />
  );
}
