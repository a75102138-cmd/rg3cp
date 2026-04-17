"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { Timeline } from "@/components/shared/timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllLogbooksForProject } from "@/lib/api/resources";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function JournalTimelinePage() {
  const { projectId } = useProjectContext();
  const q = useQuery({
    queryKey: ["logbooks", "project", projectId],
    queryFn: () => fetchAllLogbooksForProject(projectId!),
    enabled: Boolean(projectId),
  });

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Journal", href: "/journal" },
            { label: "Chronologie" },
          ]}
        />
        <PageTitle
          title="Chronologie du journal"
          description="Sélectionnez un projet pour afficher la ligne du temps des entrées."
        />
        <div className="rounded-xl border border-dashed border-muted-foreground/30 px-6 py-10 text-center text-sm text-muted-foreground">
          Aucun projet sélectionné.
        </div>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const list = [...(q.data ?? [])].sort((a, b) => {
    const ta = a.eventAt ? new Date(a.eventAt).getTime() : 0;
    const tb = b.eventAt ? new Date(b.eventAt).getTime() : 0;
    return tb - ta;
  });

  const items = list.map((l) => ({
    id: l.id,
    at: l.eventAt ?? l.createdAt ?? l.id,
    title: `${l.code} — ${l.title}`,
    description: l.description ?? undefined,
    badge: (
      <Link
        href={`/journal/${l.id}`}
        className="text-xs text-bronze hover:underline"
      >
        Ouvrir la fiche
      </Link>
    ),
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Journal", href: "/journal" },
          { label: "Chronologie" },
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Chronologie du journal"
          description="Vue linéaire des entrées du projet sélectionné — chaque bloc renvoie vers le détail."
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/journal">Liste</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 px-8 py-12 text-center text-sm text-muted-foreground">
          Aucune entrée pour ce projet.
        </div>
      ) : (
        <Timeline items={items} />
      )}
    </div>
  );
}
