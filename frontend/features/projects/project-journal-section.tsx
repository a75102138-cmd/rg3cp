"use client";

import { DocumentViewerDialog, documentLabel } from "@/components/shared/document-viewer-dialog";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { documentsApi, fetchAllPages } from "@/lib/api/resources";
import { effectiveDocumentDateIso } from "@/lib/date-display";
import { formatDate } from "@/lib/format";
import { formatIsoDateFolder, LOGBOOK_BDD_CATEGORY, LOGBOOK_FOLDER_CONFIG } from "@/lib/logbook-folders";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiDocument, ApiZone } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Props = { projectId: string; projectName: string; zones: ApiZone[] };
type UploadContext = { tableName: string; subFolder?: string } | null;

export function ProjectJournalSection({ projectId, projectName }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({});
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [currentSubFolder, setCurrentSubFolder] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [takenAtLocal, setTakenAtLocal] = useState("");
  const [filesError, setFilesError] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<ApiDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ApiDocument | null>(null);

  const listQ = useQuery({
    queryKey: ["project-journal-files", projectId],
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({
          projectId,
          projectOnly: "true",
          bddCategory: LOGBOOK_BDD_CATEGORY,
          limit: 100,
          page,
        }),
      ),
    enabled: Boolean(projectId),
  });

  const docs = listQ.data ?? [];
  const loading = listQ.isLoading;
  const loadError = listQ.isError;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["project-journal-files", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
  };

  const manifoldDateFolders = useMemo(() => {
    const set = new Set<string>();
    for (const d of docs) {
      if (d.tableName !== "T_PV_CHANTIER") continue;
      if (!d.subFolder?.startsWith("PV_MANIFOLD/")) continue;
      const date = d.subFolder.slice("PV_MANIFOLD/".length);
      if (date) set.add(date);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [docs]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadContext || !currentTable) throw new Error("Upload context missing");
      const selectedDate = takenAtLocal ? new Date(takenAtLocal) : new Date();
      const dateFolder = formatIsoDateFolder(selectedDate);
      const baseSubFolder = uploadContext.subFolder?.trim();
      const finalSubFolder = baseSubFolder
        ? baseSubFolder === "PV_MANIFOLD"
          ? `PV_MANIFOLD/${dateFolder}`
          : baseSubFolder
        : dateFolder;
      return documentsApi.uploadUnified(files, {
        projectId,
        fileKind: "REPORT",
        category: LOGBOOK_BDD_CATEGORY,
        bddCategory: LOGBOOK_BDD_CATEGORY,
        tableName: currentTable,
        subFolder: finalSubFolder,
        folderPath: `${LOGBOOK_BDD_CATEGORY}/${currentTable}/${finalSubFolder}/${dateFolder}`,
        scope: "PROJECT",
        documentDate: selectedDate.toISOString(),
      });
    },
    onSuccess: () => {
      toastSuccess(files.length > 1 ? "Fichiers du journal ajoutés avec succès." : "Fichier ajouté avec succès.");
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
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: (_, deletedId) => {
      toastSuccess("Fichier supprimé avec succès.");
      setDeleteDoc(null);
      setViewerDoc((prev) => (prev?.id === deletedId ? null : prev));
      invalidate();
    },
    onError: (e: unknown) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const currentPathLabel =
    currentTable && currentSubFolder
      ? `${LOGBOOK_BDD_CATEGORY} / ${currentTable} / ${currentSubFolder}`
      : currentTable
        ? `${LOGBOOK_BDD_CATEGORY} / ${currentTable}`
        : "Aucun dossier sélectionné";

  const filesForFolder = (tableName: string, subFolder: string) =>
    docs.filter((d) => d.tableName === tableName && d.subFolder === subFolder);

  const openUploadForFolder = (tableName: string, subFolder?: string) => {
    setCurrentTable(tableName);
    setCurrentSubFolder(subFolder ?? null);
    setUploadContext({ tableName, subFolder: subFolder?.trim() || undefined });
    setFilesError(null);
    setUploadOpen(true);
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
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          Impossible de charger les fichiers existants. La structure reste disponible pour l’upload.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="space-y-1.5">
          {LOGBOOK_FOLDER_CONFIG.tables.map((table) => {
            const tableOpen = Boolean(expandedTables[table.tableName]);
            return (
              <div key={table.tableName} className="space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/90 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
                  onClick={() => {
                    setExpandedTables((prev) => ({ ...prev, [table.tableName]: !prev[table.tableName] }));
                    setCurrentTable(table.tableName);
                    setCurrentSubFolder(null);
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-sm text-foreground">
                    <Folder className="h-4 w-4" />
                    {table.tableName}
                  </span>
                  {tableOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {tableOpen ? (
                  <div className="space-y-1.5">
                    <div className="ml-6 space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {LOGBOOK_BDD_CATEGORY} / {table.tableName}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            openUploadForFolder(table.tableName);
                          }}
                        >
                          <FilePlus2 className="h-3.5 w-3.5" />
                          Ajouter ici
                        </Button>
                      </div>
                    </div>
                    {table.subFolders.map((subFolder) => {
                      const key = `${table.tableName}::${subFolder}`;
                      const open = Boolean(expandedSubFolders[key]);
                      const folderFiles =
                        subFolder === "PV_MANIFOLD"
                          ? []
                          : filesForFolder(table.tableName, subFolder);
                      return (
                        <div key={key} className="space-y-2" style={{ marginLeft: 16 }}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-white px-4 py-2.5 text-left transition hover:bg-muted/20"
                            onClick={() => {
                              setExpandedSubFolders((prev) => ({ ...prev, [key]: !prev[key] }));
                              setCurrentTable(table.tableName);
                              setCurrentSubFolder(subFolder);
                            }}
                          >
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                              <Folder className="h-4 w-4" />
                              {subFolder}
                            </span>
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>

                          {open ? (
                            <div
                              className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3"
                              style={{ marginLeft: 32 }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {LOGBOOK_BDD_CATEGORY} / {table.tableName} / {subFolder}
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 gap-2"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openUploadForFolder(
                                      table.tableName,
                                      subFolder === "PV_MANIFOLD" ? "PV_MANIFOLD" : subFolder,
                                    );
                                  }}
                                >
                                  <FilePlus2 className="h-3.5 w-3.5" />
                                  Ajouter ici
                                </Button>
                              </div>

                                  {subFolder === "PV_MANIFOLD" ? (
                                    <div className="space-y-2">
                                      {manifoldDateFolders.map((dateFolder) => {
                                        const manifoldFiles = filesForFolder(
                                          table.tableName,
                                          `PV_MANIFOLD/${dateFolder}`,
                                        );
                                        return (
                                          <div key={dateFolder} className="space-y-2">
                                            <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                                              <Folder className="h-3.5 w-3.5" />
                                              {dateFolder}
                                            </div>
                                            <ul className="space-y-2">
                                              {manifoldFiles.map((doc) => (
                                                <li
                                                  key={doc.id}
                                                  role="button"
                                                  tabIndex={0}
                                                  className="group cursor-pointer rounded-lg border border-border/70 bg-card/70 p-3 transition hover:border-primary/35"
                                                  onClick={() => setViewerDoc(doc)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                      e.preventDefault();
                                                      setViewerDoc(doc);
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                      <p className="truncate text-sm font-medium text-foreground">
                                                        {documentLabel(doc)}
                                                      </p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {effectiveDocumentDateIso(doc)
                                                          ? formatDate(effectiveDocumentDateIso(doc)!)
                                                          : "—"}{" "}
                                                        · {doc.status ?? "PENDING"}
                                                      </p>
                                                    </div>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteDoc(doc);
                                                      }}
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                      Supprimer
                                                    </Button>
                                                  </div>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <ul className="space-y-2">
                                      {folderFiles.map((doc) => (
                                        <li
                                          key={doc.id}
                                          role="button"
                                          tabIndex={0}
                                          className="group cursor-pointer rounded-lg border border-border/70 bg-card/70 p-3 transition hover:border-primary/35"
                                          onClick={() => setViewerDoc(doc)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              setViewerDoc(doc);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                              <p className="truncate text-sm font-medium text-foreground">
                                                {documentLabel(doc)}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {effectiveDocumentDateIso(doc)
                                                  ? formatDate(effectiveDocumentDateIso(doc)!)
                                                  : "—"}{" "}
                                                · {doc.status ?? "PENDING"}
                                              </p>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteDoc(doc);
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
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des fichiers journal"
        description={
          <>
            Projet : <strong className="text-foreground">{projectName}</strong>.
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
                  setFilesError("Choisissez au moins un fichier.");
                  return;
                }
                if (!uploadContext?.tableName) {
                  setFilesError("Sélectionnez au moins une table.");
                  return;
                }
                setFilesError(null);
                uploadMutation.mutate();
              }}
            >
              {uploadMutation.isPending ? (
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
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="journal-files">Fichiers *</Label>
            <Input
              id="journal-files"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="journal-date">Date (optionnel)</Label>
            <Input
              id="journal-date"
              type="date"
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

      <DocumentViewerDialog
        doc={viewerDoc}
        onOpenChange={(o) => !o && setViewerDoc(null)}
        emptyTitle="Fichier"
      />

      <Dialog open={Boolean(deleteDoc)} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce fichier ?</DialogTitle>
            <DialogDescription className="text-left">
              « {deleteDoc ? documentLabel(deleteDoc) : ""} » sera retiré du journal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteDoc(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc.id)}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
