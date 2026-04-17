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
import { RISK_FOLDER_CONFIG } from "@/lib/risk-folders";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiDocument, ApiZone } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Props = { projectId: string; projectName: string; zones: ApiZone[] };
type UploadContext = { tableName: string } | null;
const RISK_BDD = "BDD_SECURITE";
const RISK_SUBFOLDER = "GENERAL";
const TABLE_LABELS: Record<string, string> = {
  T_SECURITE_CHANTIER: "Sécurité chantier",
  T_ENVIRONNEMENT: "Environnement",
  T_ACCES_SITE: "Accès site",
};

export function ProjectRisksSection({ projectId, projectName }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<ApiDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ApiDocument | null>(null);
  const tableConfigs = useMemo(() => RISK_FOLDER_CONFIG.bdds[0]?.tables ?? [], []);

  const listQ = useQuery({
    queryKey: ["project-risk-files", projectId],
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({
          projectId,
          projectOnly: "true",
          bddCategory: RISK_BDD,
          limit: 100,
          page,
        }),
      ),
    enabled: Boolean(projectId),
  });

  const docs = listQ.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["project-risk-files", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadContext) throw new Error("Upload context missing");
      return documentsApi.uploadUnified(files, {
        projectId,
        fileKind: "REPORT",
        category: RISK_BDD,
        bddCategory: RISK_BDD,
        tableName: uploadContext.tableName,
        subFolder: RISK_SUBFOLDER,
        folderPath: `${RISK_BDD}/${uploadContext.tableName}/${RISK_SUBFOLDER}`,
        scope: "PROJECT",
      });
    },
    onSuccess: () => {
      toastSuccess(files.length > 1 ? "Fichiers ajoutés avec succès." : "Fichier ajouté avec succès.");
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

  const currentPathLabel = currentTable ? TABLE_LABELS[currentTable] ?? currentTable : "Aucun dossier sélectionné";

  const filesForTable = (tableName: string) =>
    docs.filter((d) => d.bddCategory === RISK_BDD && d.tableName === tableName && d.subFolder === RISK_SUBFOLDER);

  const openUploadForTable = (tableName: string) => {
    setCurrentTable(tableName);
    setUploadContext({ tableName });
    setUploadOpen(true);
    setFilesError(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dossier actif: <span className="font-medium text-foreground">{currentPathLabel}</span>
        </p>
      </div>

      {listQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {tableConfigs.map((table) => {
          const tableOpen = Boolean(expandedTables[table.tableName]);
          const tableFiles = filesForTable(table.tableName);
          return (
            <div key={table.tableName} className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border/90 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
                onClick={() => {
                  setExpandedTables((prev) => ({ ...prev, [table.tableName]: !prev[table.tableName] }));
                  setCurrentTable(table.tableName);
                }}
              >
                <span className="inline-flex items-center gap-2 text-sm text-foreground">
                  <Folder className="h-4 w-4" />
                  {TABLE_LABELS[table.tableName] ?? table.tableName}
                </span>
                {tableOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {tableOpen ? (
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3" style={{ marginLeft: 32 }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {RISK_BDD} / {table.tableName} / {RISK_SUBFOLDER}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        openUploadForTable(table.tableName);
                      }}
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      Ajouter ici
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {tableFiles.map((doc) => (
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
        })}
      </div>

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des fichiers risques"
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
            <Label htmlFor="risk-files">Fichiers *</Label>
            <Input
              id="risk-files"
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
              « {deleteDoc ? documentLabel(deleteDoc) : ""} » sera retiré du dossier risques.
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
