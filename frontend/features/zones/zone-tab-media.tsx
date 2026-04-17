"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { PhotoViewerDialog, photoLabel } from "@/components/shared/photo-viewer-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllPages, photosApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiPhoto, ApiProject, ApiZone } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Props = { zone: ApiZone; project: ApiProject };

export function ZoneTabMedia({ zone, project }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ApiPhoto | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<ApiPhoto | null>(null);

  const listQ = useQuery({
    queryKey: ["zone-media-simple", zone.id],
    queryFn: () =>
      fetchAllPages((page) =>
        photosApi.list({
          zoneId: zone.id,
          zoneOnly: "true",
          projectId: project.id,
          limit: 100,
          page,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ),
    enabled: Boolean(zone.id),
  });

  const photos = useMemo(
    () => (listQ.data ?? []).filter((p) => p.tableName === "zone-media" && p.subFolder === "avancement"),
    [listQ.data],
  );

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["zone-media-simple", zone.id] });
    await qc.invalidateQueries({ queryKey: ["zone", zone.id] });
  };

  const uploadMut = useMutation({
    mutationFn: async () =>
      photosApi.uploadUnified(files, {
        projectId: project.id,
        bddCategory: "BDD_MEDIA",
        tableName: "zone-media",
        subFolder: "avancement",
        folderPath: "ZONE_MEDIA/avancement",
        category: "BDD_MEDIA_MEDIATHEQUE_HD",
        scope: "ZONE",
        relatedZoneId: zone.id,
      }),
    onSuccess: async () => {
      toastSuccess(files.length > 1 ? "Photos ajoutées avec succès." : "Photo ajoutée avec succès.");
      setUploadOpen(false);
      setFiles([]);
      setFilesError(null);
      if (inputRef.current) inputRef.current.value = "";
      await invalidate();
    },
    onError: () => toastUploadError(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => photosApi.remove(id),
    onSuccess: async (_, deletedId) => {
      toastSuccess("Photo supprimée avec succès.");
      setDeletePhoto(null);
      setViewer((prev) => (prev?.id === deletedId ? null : prev));
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const currentPathLabel = folderOpen ? "Photos d’avancement" : "Aucun dossier sélectionné";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dossier actif: <span className="font-medium text-foreground">{currentPathLabel}</span>
        </p>
      </div>

      {listQ.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border/90 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
          onClick={() => setFolderOpen((v) => !v)}
        >
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            <Folder className="h-4 w-4" />
            Photos d’avancement
          </span>
          {folderOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {folderOpen ? (
          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/10 p-3" style={{ marginLeft: 32 }}>
            <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Zone — Photos d’avancement</p>
              <Button type="button" size="sm" className="h-8 gap-2" onClick={() => setUploadOpen(true)}>
                <FilePlus2 className="h-3.5 w-3.5" />
                Ajouter ici
              </Button>
            </div>
            {photos.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 bg-background/70 px-3 py-4 text-center text-sm text-muted-foreground">
                Aucune photo pour ce dossier
              </p>
            ) : (
              <ul className="space-y-2">
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    role="button"
                    tabIndex={0}
                    className="group cursor-pointer rounded-lg border border-border/70 bg-card/70 p-3 transition hover:border-primary/35"
                    onClick={() => setViewer(photo)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewer(photo);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{photoLabel(photo)}</p>
                        <p className="text-xs text-muted-foreground">{photo.createdAt ? formatDate(photo.createdAt) : "—"}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePhoto(photo);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des photos"
        description={`Zone ${zone.name} — dossier Photos d’avancement.`}
        size="sm"
        variant="form"
        bodyClassName="max-h-[70vh]"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={uploadMut.isPending}
              onClick={() => {
                if (!files.length) {
                  setFilesError("Sélectionnez au moins une image.");
                  return;
                }
                uploadMut.mutate();
              }}
            >
              {uploadMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="zone-media-files">Fichiers *</Label>
            <Input
              id="zone-media-files"
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
          {filesError ? <p className="text-sm text-destructive">{filesError}</p> : null}
        </div>
      </EntityFormModal>

      <PhotoViewerDialog
        photo={viewer}
        onOpenChange={(open) => {
          if (!open) setViewer(null);
        }}
        showEffectiveDate
      />

      <Dialog open={Boolean(deletePhoto)} onOpenChange={(o) => !o && setDeletePhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette photo ?</DialogTitle>
            <DialogDescription className="text-left">
              « {deletePhoto ? photoLabel(deletePhoto) : ""} » sera retirée du dossier.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletePhoto(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deletePhoto && deleteMut.mutate(deletePhoto.id)}
            >
              {deleteMut.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
