"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { PhotoViewerDialog } from "@/components/shared/photo-viewer-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { effectivePhotoDateIso } from "@/lib/date-display";
import { fetchAllPages, photosApi, projectsApi } from "@/lib/api/resources";
import {
  MEDIA_BDD_CATEGORY,
  MEDIA_FOLDER_CONFIG,
  mediaFolderPath,
  mediaHumanLabel,
} from "@/lib/media-folders";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import { formatDate } from "@/lib/format";
import type { ApiPhoto } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";

function displayTitle(photo: ApiPhoto): string {
  return photo.title?.trim() || photo.caption?.trim() || photo.originalFilename || photo.id;
}

function isoDateFolderFromPhoto(photo: ApiPhoto): string {
  if (photo.dateFolder?.trim()) return photo.dateFolder;
  const iso = effectivePhotoDateIso(photo);
  if (!iso) return "unknown-date";
  return iso.slice(0, 10);
}

type Props = {
  projectId: string;
  projectName: string;
};

type UploadContext = { tableName: string; subFolder: string } | null;

export function ProjectPhotosSection({ projectId, projectName }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canUpload = user?.role === "USER";

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({});
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [currentSubFolder, setCurrentSubFolder] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [takenAtLocal, setTakenAtLocal] = useState("");
  const [filesError, setFilesError] = useState<string | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState<ApiPhoto | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<ApiPhoto | null>(null);

  const listQ = useQuery({
    queryKey: ["project-photos", projectId],
    queryFn: () =>
      fetchAllPages((page) =>
        photosApi.list({
          projectId,
          projectOnly: "true",
          bddCategory: MEDIA_BDD_CATEGORY,
          limit: 100,
          page,
        }),
      ),
    enabled: Boolean(projectId),
  });

  const assignmentsQ = useQuery({
    queryKey: ["project-assignments", projectId],
    queryFn: () => projectsApi.getAssignments(projectId),
    enabled: Boolean(projectId && isAdmin),
  });

  const assignedActorsText =
    (assignmentsQ.data?.actorAssignments ?? [])
      .map((a) => a.actor?.name ?? a.actor?.code)
      .filter(Boolean)
      .join(", ") || "—";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["project-photos", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadContext) throw new Error("Upload context missing");
      return photosApi.uploadUnified(files, {
        projectId,
        bddCategory: MEDIA_BDD_CATEGORY,
        tableName: uploadContext.tableName,
        subFolder: uploadContext.subFolder,
        folderPath: mediaFolderPath(uploadContext.tableName, uploadContext.subFolder),
        category: MEDIA_BDD_CATEGORY,
        subCategory: `${uploadContext.tableName}_${uploadContext.subFolder}`,
        scope: "PROJECT",
        takenAt: takenAtLocal ? new Date(takenAtLocal).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toastSuccess(files.length > 1 ? "Photos ajoutées avec succès." : "Photo ajoutée avec succès.");
      setUploadOpen(false);
      setFiles([]);
      setTakenAtLocal("");
      setFilesError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidate();
    },
    onError: () => toastUploadError(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => photosApi.remove(id),
    onSuccess: (_, deletedId) => {
      toastSuccess("Photo supprimée avec succès.");
      setDeletePhoto(null);
      setViewerPhoto((prev) => (prev?.id === deletedId ? null : prev));
      invalidate();
    },
    onError: (e: unknown) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const photos = listQ.data ?? [];
  const loading = listQ.isLoading;
  const loadError = listQ.isError;

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const toggleSubFolder = (tableName: string, subFolder: string) => {
    const key = `${tableName}::${subFolder}`;
    setExpandedSubFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentPathLabel =
    currentTable && currentSubFolder
      ? `MEDIA / ${mediaHumanLabel(currentTable)} / ${mediaHumanLabel(currentSubFolder)}`
      : "Aucun dossier sélectionné";

  const openUploadForFolder = (tableName: string, subFolder: string) => {
    if (!canUpload) return;
    setCurrentTable(tableName);
    setCurrentSubFolder(subFolder);
    setUploadContext({ tableName, subFolder });
    setFilesError(null);
    setUploadOpen(true);
  };

  const filesForFolder = (tableName: string, subFolder: string) =>
    photos.filter((p) => p.tableName === tableName && p.subFolder === subFolder);

  const groupedByDateFolder = (folderFiles: ApiPhoto[]) => {
    const map = new Map<string, ApiPhoto[]>();
    for (const photo of folderFiles) {
      const key = isoDateFolderFromPhoto(photo);
      const bucket = map.get(key);
      if (bucket) bucket.push(photo);
      else map.set(key, [photo]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dossier actif:{" "}
          <span className="font-medium text-foreground">{currentPathLabel}</span>
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
          <p className="font-medium text-destructive">Impossible de charger les photos.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => listQ.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : loading ? (
        <div className="ml-0 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {MEDIA_FOLDER_CONFIG.tables.map((table) => {
            const tableOpen = Boolean(expandedTables[table.tableName]);
            return (
              <div key={table.tableName} className="space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/90 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
                  onClick={() => {
                    toggleTable(table.tableName);
                    setCurrentTable(table.tableName);
                    setCurrentSubFolder(null);
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-sm text-foreground">
                    <Folder className="h-4 w-4" />
                    {table.tableName}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${tableOpen ? "rotate-90" : ""}`} />
                </button>

                {tableOpen ? (
                  <div className="space-y-1.5">
                    {table.subFolders.map((subFolder) => {
                      const key = `${table.tableName}::${subFolder}`;
                      const open = Boolean(expandedSubFolders[key]);
                      const folderFiles = filesForFolder(table.tableName, subFolder);
                      return (
                        <div key={key} className="space-y-2" style={{ marginLeft: 16 }}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-white px-4 py-2.5 text-left transition hover:bg-muted/20"
                            onClick={() => {
                              toggleSubFolder(table.tableName, subFolder);
                              setCurrentTable(table.tableName);
                              setCurrentSubFolder(subFolder);
                            }}
                          >
                            <span className="inline-flex items-center gap-2 text-sm font-normal text-foreground">
                              <Folder className="h-4 w-4" />
                              {subFolder}
                            </span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                          </button>

                          {open ? (
                            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3" style={{ marginLeft: 32 }}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                  MEDIA / {mediaHumanLabel(table.tableName)} / {mediaHumanLabel(subFolder)}
                                </p>
                                {!isAdmin && canUpload ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 gap-2"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openUploadForFolder(table.tableName, subFolder);
                                    }}
                                  >
                                    <FilePlus2 className="h-3.5 w-3.5" />
                                    Ajouter ici
                                  </Button>
                                ) : null}
                              </div>

                              {folderFiles.length === 0 ? (
                                <div className="rounded-md border border-dashed border-border/70 bg-background/70 px-4 py-5 text-center text-xs text-muted-foreground">
                                  Dossier vide
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {groupedByDateFolder(folderFiles).map(([dateFolder, dayFiles]) => (
                                    <div key={dateFolder} className="space-y-2">
                                      <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                                        <Folder className="h-3.5 w-3.5" />
                                        {dateFolder}
                                      </div>
                                      <ul className="space-y-2">
                                        {dayFiles.map((photo) => {
                                          const src = photo.secureUrl || photo.url;
                                          const label = displayTitle(photo);
                                          const when = effectivePhotoDateIso(photo);
                                          return (
                                            <li
                                              key={photo.id}
                                              role="button"
                                              tabIndex={0}
                                              className="group cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card/70 transition hover:border-primary/35"
                                              onClick={() => setViewerPhoto(photo)}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault();
                                                  setViewerPhoto(photo);
                                                }
                                              }}
                                            >
                                              <div className="flex items-center gap-3 p-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                                  {src ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                                                  ) : null}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {when ? formatDate(when) : "—"} · {photo.status ?? "PENDING"}
                                                    {isAdmin ? (
                                                      <>
                                                        {" "}
                                                        · Uploader: {photo.uploadedById ? photo.uploadedById.slice(0, 8) : "—"}
                                                        {" "}
                                                        · Validé par:{" "}
                                                        {photo.validatedById ? photo.validatedById.slice(0, 8) : "—"}
                                                        {" "}
                                                        · Acteurs assignés: {assignedActorsText}
                                                        {photo.status === "REJECTED" && photo.remarks ? (
                                                          <>
                                                            {" "}
                                                            · Motif: {photo.remarks.slice(0, 60)}
                                                          </>
                                                        ) : null}
                                                      </>
                                                    ) : null}
                                                  </p>
                                                </div>
                                                <div
                                                  className="flex shrink-0"
                                                  onClick={(e) => e.stopPropagation()}
                                                  onKeyDown={(e) => e.stopPropagation()}
                                                  onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                  {!isAdmin ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                                                      onClick={() => setDeletePhoto(photo)}
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                      Supprimer
                                                    </Button>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <PhotoViewerDialog
        photo={viewerPhoto}
        onOpenChange={(open) => {
          if (!open) setViewerPhoto(null);
        }}
        showEffectiveDate
      />

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des photos"
        description={
          <>
            Projet : <strong className="text-foreground">{projectName}</strong>.<br />
            Dossier :{" "}
            <strong className="text-foreground">
              MEDIA / {uploadContext ? mediaHumanLabel(uploadContext.tableName) : ""} /{" "}
              {uploadContext ? mediaHumanLabel(uploadContext.subFolder) : ""}
            </strong>
          </>
        }
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
              disabled={uploadMutation.isPending}
              onClick={() => {
                if (!files.length) {
                  setFilesError("Choisissez au moins une image.");
                  return;
                }
                if (!uploadContext) {
                  setFilesError("Ouvrez un sous-dossier avant l’upload.");
                  return;
                }
                setFilesError(null);
                uploadMutation.mutate();
              }}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pp-files">Images *</Label>
              <Input
                id="pp-files"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const arr = e.target.files
                    ? Array.from(e.target.files).filter((f) => f.type.startsWith("image/"))
                    : [];
                  setFiles(arr);
                  if (arr.length) setFilesError(null);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pp-taken">Date réelle de prise (optionnel)</Label>
              <Input
                id="pp-taken"
                type="datetime-local"
                value={takenAtLocal}
                onChange={(e) => setTakenAtLocal(e.target.value)}
              />
            </div>
            {filesError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
                {filesError}
              </p>
            ) : null}
        </div>
      </EntityFormModal>

      <Dialog
        open={Boolean(deletePhoto)}
        onOpenChange={(o) => {
          if (!o) setDeletePhoto(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette photo ?</DialogTitle>
            <DialogDescription className="text-left">
              « {deletePhoto ? displayTitle(deletePhoto) : ""} » sera retirée de la galerie projet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletePhoto(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletePhoto && deleteMutation.mutate(deletePhoto.id)}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
