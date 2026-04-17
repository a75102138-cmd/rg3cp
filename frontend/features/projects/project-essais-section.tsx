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
import { ESSAIS_BDD_CATEGORY, ESSAIS_FOLDER_CONFIG } from "@/lib/essais-folders";
import { formatDate } from "@/lib/format";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiDocument } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

type Props = { projectId: string; projectName: string };
type UploadContext = { tableName: string; subFolder: string } | null;

function isNodeWithChildren(
  node: (typeof ESSAIS_FOLDER_CONFIG.tables)[number]["subFolders"][number],
): node is { name: string; children: readonly string[] } {
  return typeof node === "object" && node != null && "children" in node;
}

export function ProjectEssaisSection({ projectId, projectName }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({});
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [currentSubFolder, setCurrentSubFolder] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<ApiDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ApiDocument | null>(null);

  const listQ = useQuery({
    queryKey: ["project-essais-files", projectId],
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({
          projectId,
          projectOnly: "true",
          bddCategory: ESSAIS_BDD_CATEGORY,
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
    queryClient.invalidateQueries({ queryKey: ["project-essais-files", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadContext) throw new Error("Upload context missing");
      return documentsApi.uploadUnified(files, {
        projectId,
        fileKind: "REPORT",
        category: ESSAIS_BDD_CATEGORY,
        bddCategory: ESSAIS_BDD_CATEGORY,
        tableName: uploadContext.tableName,
        subFolder: uploadContext.subFolder,
        folderPath: `${ESSAIS_BDD_CATEGORY}/${uploadContext.tableName}/${uploadContext.subFolder}`,
        scope: "PROJECT",
      });
    },
    onSuccess: () => {
      toastSuccess(files.length > 1 ? "Fichiers essais ajoutés avec succès." : "Fichier ajouté avec succès.");
      setUploadOpen(false);
      setFiles([]);
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
      ? `${ESSAIS_BDD_CATEGORY} / ${currentTable} / ${currentSubFolder}`
      : currentTable
        ? `${ESSAIS_BDD_CATEGORY} / ${currentTable}`
        : "Aucun dossier sélectionné";

  const openUploadForFolder = (tableName: string, subFolder: string) => {
    setCurrentTable(tableName);
    setCurrentSubFolder(subFolder);
    setUploadContext({ tableName, subFolder });
    setFilesError(null);
    setUploadOpen(true);
  };

  const filesForFolder = (tableName: string, subFolder: string) =>
    docs.filter((d) => d.tableName === tableName && d.subFolder === subFolder);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dossier actif: <span className="font-medium text-foreground">{currentPathLabel}</span>
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          Impossible de charger les fichiers existants. La structure reste disponible pour l’upload.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {ESSAIS_FOLDER_CONFIG.tables.map((table) => {
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
                  {table.subFolders.map((node) => {
                    if (!isNodeWithChildren(node)) {
                      const key = `${table.tableName}::${node}`;
                      const open = Boolean(expandedSubFolders[key]);
                      const folderFiles = filesForFolder(table.tableName, node);
                      return (
                        <div key={key} className="space-y-2" style={{ marginLeft: 16 }}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-white px-4 py-2.5 text-left transition hover:bg-muted/20"
                            onClick={() => {
                              setExpandedSubFolders((prev) => ({ ...prev, [key]: !prev[key] }));
                              setCurrentTable(table.tableName);
                              setCurrentSubFolder(node);
                            }}
                          >
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                              <Folder className="h-4 w-4" />
                              {node}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 gap-1.5 px-2.5"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openUploadForFolder(table.tableName, node);
                                }}
                              >
                                <FilePlus2 className="h-3.5 w-3.5" />
                                Ajouter ici
                              </Button>
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          </button>
                          {open ? (
                            <div
                              className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3"
                              style={{ marginLeft: 32 }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {ESSAIS_BDD_CATEGORY} / {table.tableName} / {node}
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 gap-2"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openUploadForFolder(table.tableName, node);
                                  }}
                                >
                                  <FilePlus2 className="h-3.5 w-3.5" />
                                  Ajouter ici
                                </Button>
                              </div>
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
                                        <p className="truncate text-sm font-medium text-foreground">{documentLabel(doc)}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {effectiveDocumentDateIso(doc) ? formatDate(effectiveDocumentDateIso(doc)!) : "—"} ·{" "}
                                          {doc.status ?? "PENDING"}
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
                          ) : null}
                        </div>
                      );
                    }

                    const parentKey = `${table.tableName}::${node.name}`;
                    const parentOpen = Boolean(expandedSubFolders[parentKey]);
                    return (
                      <div key={parentKey} className="space-y-2" style={{ marginLeft: 16 }}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-white px-4 py-2.5 text-left transition hover:bg-muted/20"
                          onClick={() => {
                            setExpandedSubFolders((prev) => ({ ...prev, [parentKey]: !prev[parentKey] }));
                            setCurrentTable(table.tableName);
                            setCurrentSubFolder(null);
                          }}
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-foreground">
                            <Folder className="h-4 w-4" />
                            {node.name}
                          </span>
                          {parentOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        {parentOpen ? (
                          <div className="space-y-1.5">
                            {node.children.map((child) => {
                              const childPath = `${node.name}/${child}`;
                              const childKey = `${table.tableName}::${childPath}`;
                              const childOpen = Boolean(expandedSubFolders[childKey]);
                              const childFiles = filesForFolder(table.tableName, childPath);
                              return (
                                <div key={childKey} className="space-y-2" style={{ marginLeft: 16 }}>
                                  <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-2.5 text-left transition hover:bg-muted/20"
                                    onClick={() => {
                                      setExpandedSubFolders((prev) => ({ ...prev, [childKey]: !prev[childKey] }));
                                      setCurrentTable(table.tableName);
                                      setCurrentSubFolder(childPath);
                                    }}
                                  >
                                    <span className="inline-flex items-center gap-2 text-sm text-foreground">
                                      <Folder className="h-4 w-4" />
                                      {child}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-7 gap-1.5 px-2.5"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openUploadForFolder(table.tableName, childPath);
                                        }}
                                      >
                                        <FilePlus2 className="h-3.5 w-3.5" />
                                        Ajouter ici
                                      </Button>
                                      {childOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </span>
                                  </button>
                                  {childOpen ? (
                                    <div
                                      className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3"
                                      style={{ marginLeft: 32 }}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-muted-foreground">
                                          {ESSAIS_BDD_CATEGORY} / {table.tableName} / {childPath}
                                        </p>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-8 gap-2"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openUploadForFolder(table.tableName, childPath);
                                          }}
                                        >
                                          <FilePlus2 className="h-3.5 w-3.5" />
                                          Ajouter ici
                                        </Button>
                                      </div>
                                      <ul className="space-y-2">
                                        {childFiles.map((doc) => (
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
              ) : null}
            </div>
          );
        })}
      </div>

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des fichiers essais"
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
                if (!uploadContext?.tableName || !uploadContext.subFolder) {
                  setFilesError("Sélectionnez un sous-dossier.");
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
            <Label htmlFor="essais-files">Fichiers *</Label>
            <Input
              id="essais-files"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
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
              « {deleteDoc ? documentLabel(deleteDoc) : ""} » sera retiré du dossier essais.
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
