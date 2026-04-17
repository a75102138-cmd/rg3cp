"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StickyPageToolbar } from "@/components/shared/sticky-page-toolbar";
import { DetailSection } from "@/components/shared/detail-section";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { decisionsForZoneIds, interventionsForZoneIds } from "@/lib/api/project-scoped";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { fetchAllZonesForProject, logbooksApi } from "@/lib/api/resources";
import { formatDate, formatDateTime } from "@/lib/format";
import { interventionTypeLabel } from "@/lib/labels/intervention-type";
import { weatherLabelFr } from "@/lib/labels/weather-fr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LogbookFormDialog } from "./logbook-form-dialog";

export function JournalEntryDetailClient() {
  const params = useParams<{ journalId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const journalId = params.journalId;

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const entryQ = useQuery({
    queryKey: ["journal-entry", journalId],
    queryFn: () => logbooksApi.get(journalId),
    enabled: Boolean(journalId),
  });

  const entry = entryQ.data;
  const projectId = entry?.projectId ?? entry?.project?.id ?? "";

  const zonesQ = useQuery({
    queryKey: ["zones", "project", projectId],
    queryFn: () => fetchAllZonesForProject(projectId),
    enabled: Boolean(projectId) && entryQ.isSuccess,
  });

  const zoneIds = useMemo(() => zonesQ.data?.map((z) => z.id) ?? [], [zonesQ.data]);
  const zoneIdsKey = zoneIds.length ? zoneIds.slice().sort().join(",") : "_";

  const refsQ = useQuery({
    queryKey: ["journal-refs", projectId, zoneIdsKey],
    queryFn: async () => {
      const [decisions, interventions] = await Promise.all([
        zoneIds.length ? decisionsForZoneIds(zoneIds) : Promise.resolve([]),
        zoneIds.length ? interventionsForZoneIds(zoneIds) : Promise.resolve([]),
      ]);
      return { decisions, interventions };
    },
    enabled: Boolean(projectId) && entryQ.isSuccess && zonesQ.isFetched,
  });

  const decisions = refsQ.data?.decisions ?? [];
  const interventions = refsQ.data?.interventions ?? [];

  const projectName = entry?.project?.name ?? "Projet";

  const deleteMutation = useMutation({
    mutationFn: (id: string) => logbooksApi.remove(id),
    onSuccess: () => {
      toastSuccess("Entrée de journal supprimée avec succès.");
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["logbooks", "project", projectId] });
        queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
      }
      setDeleteOpen(false);
      router.push(projectId ? `/projects/${projectId}?tab=logbook` : "/journal");
    },
    onError: (e: unknown) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["journal-entry", journalId] });
    queryClient.invalidateQueries({ queryKey: ["logbook", journalId] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["logbooks", "project", projectId] });
    }
  };

  const formReady = Boolean(projectId) && entryQ.isSuccess && zonesQ.isFetched && refsQ.isFetched;
  const loading = entryQ.isLoading;
  const loadError = entryQ.isError;

  if (!journalId) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center text-sm">
        Paramètres d’URL invalides.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            { label: "Journal", href: "/journal" },
          ]}
        />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
          <p className="font-medium text-destructive">Entrée introuvable</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Impossible de charger cette entrée de journal.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/journal">Retour au journal</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/projects">Projets</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !entry) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-2/3 max-w-md" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            { label: "Journal", href: "/journal" },
          ]}
        />
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-8 text-center">
          <p className="font-medium text-foreground">Projet indisponible</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette entrée n’est pas rattachée à un projet connu.
          </p>
          <Button type="button" variant="outline" className="mt-6" asChild>
            <Link href="/journal">Retour au journal</Link>
          </Button>
        </div>
      </div>
    );
  }

  const entryLabel =
    entry.eventAt != null
      ? `${entry.code} · ${formatDate(entry.eventAt)}`
      : entry.title?.trim() || entry.code || "Entrée";

  const decisionLinks = entry.decisionLinks ?? [];
  const interventionLinks = entry.interventionLinks ?? [];

  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            { label: projectName, href: `/projects/${projectId}` },
            { label: "Journal", href: "/journal" },
            { label: entryLabel },
          ]}
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-[min(100%,36rem)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Journal de chantier
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              <span className="text-bronze">{entry.code}</span>{" "}
              {entry.title?.trim() || "Entrée de journal"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/projects/${projectId}?tab=logbook`}>
                <ArrowLeft className="h-4 w-4" />
                Retour au projet
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/journal">Journal</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={!formReady}
              onClick={() => setFormOpen(true)}
              title={!formReady ? "Chargement des options d’édition…" : undefined}
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </StickyPageToolbar>

      <div className="space-y-3 border-b border-border/80 pb-6">
        <PageTitle
          title={entry.title?.trim() || "Entrée de journal"}
          description="Compte rendu de chantier et liens vers décisions et interventions."
        />
        <p className="text-sm font-medium text-bronze">{entry.code}</p>
        <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
          {entry.eventAt ? formatDateTime(entry.eventAt) : "Date non renseignée"}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Projet :</span> {projectName}
        </p>
      </div>

      <DetailSection title="Informations principales">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Date et heure
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {entry.eventAt ? formatDateTime(entry.eventAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Code</dt>
            <dd className="mt-1 font-medium text-foreground">{entry.code}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projet</dt>
            <dd className="mt-1">
              <Link href={`/projects/${projectId}`} className="font-medium text-bronze hover:underline">
                {projectName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Auteur
            </dt>
            <dd className="mt-1 text-foreground">
              {entry.authorActor?.name ?? (entry.authorName?.trim() ? entry.authorName : "—")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Météo</dt>
            <dd className="mt-1 text-foreground">{weatherLabelFr(entry.weather)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Effectif</dt>
            <dd className="mt-1 text-foreground">
              {entry.workforce != null ? entry.workforce : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-foreground">
              {entry.description?.trim() ? entry.description : "—"}
            </dd>
          </div>
        </dl>
      </DetailSection>

      <DetailSection title="Décisions liées">
        {decisionLinks.length ? (
          <ul className="space-y-2">
            {decisionLinks.map((dl) => (
              <li key={dl.decision.id}>
                <Link
                  href={`/decisions/${dl.decision.id}`}
                  className="group block rounded-lg border border-border/60 bg-background/80 px-3 py-2 transition hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground group-hover:underline">
                    {dl.decision.title}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{dl.decision.code}</span>
                  {dl.note?.trim() ? (
                    <p className="mt-1 text-xs text-muted-foreground">{dl.note}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune décision liée.</p>
        )}
      </DetailSection>

      <DetailSection title="Interventions liées">
        {interventionLinks.length ? (
          <ul className="space-y-2">
            {interventionLinks.map((il) => (
              <li key={il.intervention.id}>
                <Link
                  href={`/interventions/${il.intervention.id}`}
                  className="group block rounded-lg border border-border/60 bg-background/80 px-3 py-2 transition hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground group-hover:underline">
                    {il.intervention.code} — {interventionTypeLabel(il.intervention.interventionType)}
                  </span>
                  {il.note?.trim() ? (
                    <p className="mt-1 text-xs text-muted-foreground">{il.note}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune intervention liée.</p>
        )}
      </DetailSection>

      <LogbookFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
        }}
        projectId={projectId}
        projectName={projectName}
        decisions={decisions}
        interventions={interventions}
        editingId={journalId}
        onSuccess={invalidate}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) setDeleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette entrée ?</DialogTitle>
            <DialogDescription className="text-left">
              L’entrée « {entry.title} » sera supprimée définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(journalId)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
