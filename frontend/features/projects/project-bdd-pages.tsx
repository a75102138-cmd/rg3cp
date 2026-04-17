"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDocumentsSection } from "@/features/projects/project-documents-section-folders";
import { ProjectEssaisSection } from "@/features/projects/project-essais-section";
import { ProjectJournalSection } from "@/features/projects/project-journal-section";
import { ProjectPhotosSection } from "@/features/projects/project-photos-section";
import { ProjectRisksSection } from "@/features/projects/project-risks-section";
import { fetchZonesForProjectAsPaginated, projectsApi } from "@/lib/api/resources";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

function useActiveProject() {
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

  return { activeProjectId, projectQ, zonesQ };
}

function BddPageSkeleton() {
  return <Skeleton className="h-56 w-full rounded-xl" />;
}

export function BddAdminPage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_ADMIN"]}
      sectionTitle="BDD_ADMIN_PILOTAGE & CADRE CONTRACTUEL"
      hideBddRootLevel
    />
  );
}

export function BddDoctrinePage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_DOCTRINE"]}
      sectionTitle="BDD_DOCTRINE_BIBLIOTHEQUE"
      hideBddRootLevel
    />
  );
}

export function BddPlansPage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_PLANS"]}
      sectionTitle="BDD_PLANS_ATLAS GRAPHIQUE & CARTOGRAPHIQUE"
      hideBddRootLevel
    />
  );
}

export function BddMateriauxPage() {
  const { activeProjectId, projectQ, zonesQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading || zonesQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">BDD_MATERIAUX_LABORATOIRE & SCIENCE</h2>
      <ProjectEssaisSection projectId={activeProjectId} projectName={projectQ.data.name} />
    </div>
  );
}

export function BddArcheoPage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_ARCHEO"]}
      sectionTitle="BDD_ARCHEO_ARCHEOLOGIE & MEMOIRE DU SITE"
      hideBddRootLevel
    />
  );
}

export function BddLogbookPage() {
  const { activeProjectId, projectQ, zonesQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading || zonesQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  const zones = zonesQ.data?.data ?? [];
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">BDD_LOGBOOK_LOGBOOK & JOURNAL DE BORD</h2>
      <ProjectJournalSection projectId={activeProjectId} projectName={projectQ.data.name} zones={zones} />
    </div>
  );
}

export function BddMediaPage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">BDD_MEDIA_MEDIATHEQUE HD</h2>
      <ProjectPhotosSection projectId={activeProjectId} projectName={projectQ.data.name} />
    </div>
  );
}

export function BddFinancierPage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_FINANCIER"]}
      sectionTitle="BDD_FINANCIER_GESTION FINANCIERE"
      hideBddRootLevel
    />
  );
}

export function BddSecuritePage() {
  const { activeProjectId, projectQ, zonesQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading || zonesQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  const zones = zonesQ.data?.data ?? [];
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">BDD_SECURITE_SECURITE & ENVIRONNEMENT</h2>
      <ProjectRisksSection projectId={activeProjectId} projectName={projectQ.data.name} zones={zones} />
    </div>
  );
}

export function BddQualitePage() {
  const { activeProjectId, projectQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  return (
    <ProjectDocumentsSection
      projectId={activeProjectId}
      projectName={projectQ.data.name}
      allowedBddCategories={["BDD_QUALITE"]}
      sectionTitle="BDD_QUALITE_ASSURANCE QUALITE"
      hideBddRootLevel
    />
  );
}

export function BddSuiviFinancierPage() {
  const { activeProjectId, projectQ, zonesQ } = useActiveProject();
  if (!activeProjectId || projectQ.isLoading || zonesQ.isLoading) return <BddPageSkeleton />;
  if (!projectQ.data) return null;
  const zones = zonesQ.data?.data ?? [];
  return (
    <div className="space-y-8">
      <ProjectDocumentsSection
        projectId={activeProjectId}
        projectName={projectQ.data.name}
        allowedBddCategories={["BDD_FINANCIER"]}
        sectionTitle="BDD_SUIVI & FINANCIER — FINANCIER"
        hideBddRootLevel
      />
      <ProjectRisksSection projectId={activeProjectId} projectName={projectQ.data.name} zones={zones} />
      <ProjectEssaisSection projectId={activeProjectId} projectName={projectQ.data.name} />
      <ProjectJournalSection projectId={activeProjectId} projectName={projectQ.data.name} zones={zones} />
    </div>
  );
}
