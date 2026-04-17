"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchAllPages, interventionsApi } from "@/lib/api/resources";
import type { ApiIntervention } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useProjectContext } from "@/providers/project-context";

const columns: { key: string; title: string }[] = [
  { key: "PLANNED", title: "Planifié" },
  { key: "IN_PROGRESS", title: "En cours" },
  { key: "VERIFIED", title: "Vérifié" },
  { key: "COMPLETED", title: "Terminé" },
  { key: "CANCELLED", title: "Annulé" },
];

function statusProgress(i: ApiIntervention): number {
  if (i.status === "COMPLETED" || i.status === "VERIFIED") return 100;
  if (i.status === "IN_PROGRESS") return 55;
  if (i.status === "CANCELLED") return 0;
  return 10;
}

export default function InterventionsKanbanPage() {
  const { projectId } = useProjectContext();
  const listQ = useQuery({
    queryKey: ["interventions", "kanban", projectId],
    queryFn: () => fetchAllPages((page) => interventionsApi.list({ page, limit: 100 })),
    enabled: Boolean(projectId),
  });
  const list = listQ.data ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Interventions", href: "/interventions" },
          { label: "Vue Kanban" },
        ]}
      />
      <PageTitle
        title="Kanban interventions"
        description="Lecture rapide par statut opérationnel — les cartes renvoient vers la fiche détaillée."
      />
      {listQ.isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {listQ.isError ? (
        <p className="text-sm text-destructive">Impossible de charger les interventions.</p>
      ) : null}
      {!listQ.isLoading && !listQ.isError && list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune intervention disponible.</p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-5">
        {columns.map((col) => {
          const items = list.filter((i) => i.status === col.key);
          return (
            <Card key={col.key} className="rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{col.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{items.length} fiches</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((i) => (
                  <Link key={i.id} href={`/interventions/${i.id}`}>
                    <div className="rounded-xl border bg-card/80 p-3 shadow-sm transition hover:shadow-md">
                      <p className="text-sm font-medium leading-snug">
                        {i.interventionType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{i.companyName ?? "—"}</p>
                      <div className="mt-2">
                        <Progress value={statusProgress(i)} />
                      </div>
                      <div className="mt-2">
                        <StatusBadge status={i.status.toLowerCase()} />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
