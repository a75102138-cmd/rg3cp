"use client";

import {
  SearchInput,
  normalizeSearchText,
  textMatchesSearchTokens,
} from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { zonesApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { cn } from "@/lib/utils";
import type { ApiZone } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ZoneFormDialog } from "./zone-form-dialog";

const ZONE_GRID = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

export function ProjectZonesSection({
  projectId,
  projectName,
  zones,
  isLoading,
  isError,
}: {
  projectId: string;
  projectName?: string;
  zones: ApiZone[];
  isLoading: boolean;
  isError: boolean;
}) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApiZone | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiZone | null>(null);

  const filtered = useMemo(() => {
    return zones.filter((z) => {
      const hayRaw = [
        z.name,
        z.code,
        z.description ?? "",
        z.project?.code ?? "",
        z.project?.name ?? "",
      ].join(" ");
      const hay = normalizeSearchText(hayRaw);
      return textMatchesSearchTokens(hay, q);
    });
  }, [zones, q]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.code.localeCompare(b.code, "fr")),
    [filtered],
  );

  const invalidateZones = () => {
    queryClient.invalidateQueries({ queryKey: ["zones", "by-project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["zones", "list", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => zonesApi.remove(id),
    onSuccess: () => {
      toastSuccess("Zone supprimée avec succès.");
      setDeleteTarget(null);
      invalidateZones();
    },
    onError: (e: unknown) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (z: ApiZone) => {
    setEditing(z);
    setFormOpen(true);
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
        <p className="font-medium text-destructive">Zones indisponibles</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Impossible de charger les zones. Réessayez plus tard.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1 text-left">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">Zones du projet</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Créez une zone avec un nom, une description et une image de couverture optionnelle.
            </p>
          </div>
          <Button type="button" className="shrink-0 gap-2 shadow-sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ajouter une zone
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
            Filtrer les zones
          </p>
          <div className="w-full rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5 shadow-sm sm:px-4">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Nom, code, description, projet…"
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className={cn(ZONE_GRID)}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[25rem] rounded-2xl" />
            ))}
          </div>
        ) : sorted.length ? (
          <div className={cn(ZONE_GRID)}>
            {sorted.map((zone) => {
              const subtitleParts = [zone.project?.code, zone.code].filter(
                (s): s is string => Boolean(s?.trim()),
              );
              const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : "Zone";
              const description = zone.description?.trim() ? zone.description : "Aucune description.";

              return (
                <Card
                  key={zone.id}
                  className={cn(
                    "group h-full overflow-hidden rounded-2xl border border-border/70 bg-card p-0 shadow-sm",
                    "transition-all duration-200 ease-out hover:border-muted-foreground/20 hover:shadow-md",
                  )}
                >
                  <Link href={`/zones/${zone.id}`} className="block">
                    <div className="relative h-40 w-full overflow-hidden bg-muted/35">
                      {zone.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={zone.imageUrl}
                          alt=""
                          className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <Layers className="h-8 w-8 opacity-45" aria-hidden />
                          <span className="text-xs font-medium">Pas d’image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="line-clamp-2 text-center text-lg font-semibold leading-tight text-foreground">
                          {zone.name}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <Link href={`/zones/${zone.id}`} className="block space-y-3 text-center">
                      <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
                      <div className="border-t border-border/50" />
                      <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
                        {description}
                      </p>
                    </Link>

                    <div className="mt-4 grid grid-cols-2 gap-2  pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 w-full gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEdit(zone);
                        }}
                      >
                        <Pencil className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full gap-2 rounded-lg border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(zone);
                        }}
                      >
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/10 px-6 py-16 text-center sm:py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
              <Search className="h-7 w-7 opacity-70" aria-hidden />
            </div>
            <p className="text-lg font-semibold text-foreground">Aucune zone</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {zones.length === 0
                ? "Ce projet n’a pas encore de zones définies. Créez la première pour organiser le chantier."
                : "Aucune zone ne correspond à votre recherche. Essayez d’autres mots ou effacez le filtre."}
            </p>
            {zones.length === 0 ? (
              <Button type="button" className="mt-8 gap-2 shadow-sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Ajouter une zone
              </Button>
            ) : (
              <Button type="button" variant="outline" className="mt-6" onClick={() => setQ("")}>
                Effacer la recherche
              </Button>
            )}
          </div>
        )}
      </div>

      <ZoneFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        projectId={projectId}
        projectName={projectName}
        editingZone={editing}
        onSuccess={invalidateZones}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la zone ?</DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground">
              La zone{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.code} — {deleteTarget?.name}
              </span>{" "}
              sera supprimée définitivement avec ses médias et risques liés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
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
    </section>
  );
}
