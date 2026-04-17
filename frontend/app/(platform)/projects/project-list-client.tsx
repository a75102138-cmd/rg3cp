"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddProjectDialog } from "@/features/projects/add-project-dialog";
import { toBadgeStatus } from "@/lib/api/badge";
import { getApiBase } from "@/lib/api/client";
import { projectsApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { ProjectCoverMedia } from "@/components/shared/project-cover-media";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectListClient() {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const q = useQuery({
    queryKey: ["projects", "list", "page"],
    queryFn: () => projectsApi.list({ limit: 100, page: 1 }),
  });
  const projects = q.data?.data ?? [];
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (status !== "all" && (p.status ?? "").toLowerCase() !== status) return false;
      if (!search.trim()) return true;
      const hay = `${p.code} ${p.name} ${p.location ?? ""} ${p.description ?? ""}`.toLowerCase();
      return hay.includes(search.trim().toLowerCase());
    });
  }, [projects, search, status]);

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "Projets" }]} />
        <PageTitle
          title="Projets patrimoniaux"
          description="Portefeuille multi-sites : chaque projet regroupe zones, diagnostics, décisions, interventions et capitalisation."
        />
      </div>
      <Button
        type="button"
        className="shrink-0 gap-2"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Ajouter un projet
      </Button>
    </div>
  );

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border bg-muted/30"
            />
          ))}
        </div>
        <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">Impossible de charger les projets.</p>
          <p className="mt-2 text-muted-foreground">
            Vérifiez que l&apos;API Nest tourne (souvent sur le port <strong>3001</strong> pour ne pas
            entrer en conflit avec Next sur 3000) et que{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_BASE_URL</code> pointe vers
            le préfixe <code className="rounded bg-muted px-1">/api</code> du backend, par ex.{" "}
            <code className="rounded bg-muted px-1">http://localhost:3001/api</code>.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            URL utilisée actuellement :{" "}
            <code className="rounded bg-muted px-1">{getApiBase()}</code>
            {" — "}redémarrer <code className="rounded bg-muted px-1">npm run dev</code> après
            modification du <code className="rounded bg-muted px-1">.env.local</code>.
          </p>
        </div>
        <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {header}

      <ListFilterBar
        filters={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full xl:w-56">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="on_hold">En pause</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        }
        search={<SearchInput value={search} onChange={setSearch} className="w-full" placeholder="Rechercher un projet…" />}
      />

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />

      {!filtered.length ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {projects.length === 0
            ? "Aucun projet en base. Utilisez « Ajouter un projet » pour en créer un, ou exécutez le script de seed du backend."
            : "Aucun projet ne correspond aux filtres."}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full overflow-hidden rounded-2xl border-border/70 transition-shadow hover:shadow-md">
                <div className="relative h-40 w-full overflow-hidden">
                  <ProjectCoverMedia
                    imageUrl={p.imageUrl}
                    alt=""
                    className="h-full w-full"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-xs font-medium text-white/80">{p.code}</p>
                    <p className="text-lg font-semibold leading-tight text-white drop-shadow-sm">
                      {p.name}
                    </p>
                  </div>
                </div>
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Site :</span>{" "}
                    {p.location?.trim() ? p.location : "—"}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description ?? "—"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={toBadgeStatus(p.status)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Début</p>
                      <p>{p.startDate ? formatDate(p.startDate) : "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Fin prévue</p>
                      <p>{p.plannedEndDate ? formatDate(p.plannedEndDate) : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
