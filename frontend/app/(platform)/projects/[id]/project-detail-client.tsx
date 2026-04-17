"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StickyPageToolbar } from "@/components/shared/sticky-page-toolbar";
import { EntityMetaGrid } from "@/components/shared/entity-meta-grid";
import { PageTitle } from "@/components/shared/page-title";
import { ProjectCoverMedia } from "@/components/shared/project-cover-media";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toBadgeStatus } from "@/lib/api/badge";
import { fetchZonesForProjectAsPaginated, projectsApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { mainNavEntries } from "@/lib/nav";
import { useQueries } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ProjectZonesSection } from "@/features/projects/project-zones-section";
import {
  BddAdminPage,
  BddArcheoPage,
  BddDoctrinePage,
  BddFinancierPage,
  BddLogbookPage,
  BddMateriauxPage,
  BddMediaPage,
  BddPlansPage,
  BddQualitePage,
  BddSecuritePage,
} from "@/features/projects/project-bdd-pages";
import { useProjectContext } from "@/providers/project-context";
import { useEffect, useMemo, useState } from "react";

const BDD_SHORT_LABELS: Record<string, string> = {
  "/bdd-admin": "ADMIN",
  "/bdd-doctrine": "DOCTRINE",
  "/bdd-plans": "PLANS",
  "/bdd-materiaux": "MATERIAUX",
  "/bdd-archeo": "ARCHEO",
  "/bdd-logbook": "LOGBOOK",
  "/bdd-media": "MEDIA",
  "/bdd-financier": "FINANCIER",
  "/bdd-securite": "SECURITE",
  "/bdd-qualite": "QUALITE",
};

export function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const { setProjectId, projectId: contextProjectId } = useProjectContext();

  useEffect(() => {
    if (id && id !== contextProjectId) setProjectId(id);
  }, [id, contextProjectId, setProjectId]);

  const bddNavEntries = useMemo(
    () => mainNavEntries.filter((item) => item.scope === "project" && item.path.startsWith("/bdd-")),
    [],
  );
  const [activeBdd, setActiveBdd] = useState("bdd-admin");

  const baseQueries = useQueries({
    queries: [
      {
        queryKey: ["project", id],
        enabled: Boolean(id),
        queryFn: () => projectsApi.get(id),
      },
      {
        queryKey: ["zones", "by-project", id],
        enabled: Boolean(id),
        queryFn: () => fetchZonesForProjectAsPaginated(id),
      },
    ],
  });

  const projectQuery = baseQueries[0];
  const zonesQuery = baseQueries[1];
  const p = projectQuery.data;
  const zones = zonesQuery.data?.data ?? [];

  if (!id) {
    return null;
  }

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted/50" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (projectQuery.isError || !p) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Projet introuvable ou erreur API.</p>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="mt-4 text-sm font-medium text-bronze underline"
        >
          Retour aux projets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StickyPageToolbar className="space-y-0 py-1.5">
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            { label: p.name },
          ]}
        />
      </StickyPageToolbar>

      <Tabs
        value={activeBdd}
        onValueChange={(v) => setActiveBdd(v)}
        className="flex w-full flex-col gap-4"
      >
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="relative h-56 w-full overflow-hidden rounded-t-2xl md:h-64">
            <ProjectCoverMedia
              imageUrl={p.imageUrl}
              alt={p.name}
              className="h-full w-full"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
          <div className="space-y-4 rounded-b-2xl p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{p.code}</p>
                <PageTitle title={p.name} description={p.description ?? ""} />
              </div>
              <StatusBadge status={toBadgeStatus(p.status)} />
            </div>
            <EntityMetaGrid
              items={[
                {
                  label: "Localisation",
                  value: p.location?.trim() ? p.location : "—",
                },
                {
                  label: "Période",
                  value: (
                    <>
                      {formatDate(p.startDate)} →{" "}
                      {p.plannedEndDate ? formatDate(p.plannedEndDate) : "non définie"}
                    </>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className="rounded-xl bg-background/95 py-1">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto min-w-max flex-nowrap justify-start gap-1 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="zones" className="gap-1.5 whitespace-nowrap">
              <Layers className="h-3.5 w-3.5" />
              Zones
            </TabsTrigger>
            {bddNavEntries.map((entry) => (
              <TabsTrigger
                key={entry.path}
                value={entry.path.slice(1)}
                className="gap-1.5 whitespace-nowrap"
                title={entry.title}
              >
                <entry.icon className="h-3.5 w-3.5" />
                {BDD_SHORT_LABELS[entry.path] ?? entry.title}
              </TabsTrigger>
            ))}
            </TabsList>
          </div>
        </div>

      </Tabs>

      {activeBdd === "zones" ? (
        <ProjectZonesSection
          projectId={p.id}
          projectName={p.name}
          zones={zones}
          isLoading={zonesQuery.isLoading}
          isError={zonesQuery.isError}
        />
      ) : null}
      {activeBdd === "bdd-admin" ? <BddAdminPage /> : null}
      {activeBdd === "bdd-doctrine" ? <BddDoctrinePage /> : null}
      {activeBdd === "bdd-plans" ? <BddPlansPage /> : null}
      {activeBdd === "bdd-materiaux" ? <BddMateriauxPage /> : null}
      {activeBdd === "bdd-archeo" ? <BddArcheoPage /> : null}
      {activeBdd === "bdd-logbook" ? <BddLogbookPage /> : null}
      {activeBdd === "bdd-media" ? <BddMediaPage /> : null}
      {activeBdd === "bdd-financier" ? <BddFinancierPage /> : null}
      {activeBdd === "bdd-securite" ? <BddSecuritePage /> : null}
      {activeBdd === "bdd-qualite" ? <BddQualitePage /> : null}
    </div>
  );
}
