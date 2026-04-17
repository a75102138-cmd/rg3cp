"use client";

import { DocumentViewerDialog, documentLabel } from "@/components/shared/document-viewer-dialog";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { documentsApi, fetchAllPages, projectsApi } from "@/lib/api/resources";
import { effectiveDocumentDateIso } from "@/lib/date-display";
import { DOCUMENT_FOLDER_CONFIG, documentFolderPath } from "@/lib/document-folders";
import { formatDate } from "@/lib/format";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiDocument } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FilePlus2, Folder, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";

type Props = {
  projectId: string;
  projectName: string;
  allowedBddCategories?: string[];
  sectionTitle?: string;
  hideBddRootLevel?: boolean;
};
type UploadContext = { bddCategory: string; tableName: string; subFolder?: string | null } | null;
type DocumentFolderNode =
  (typeof DOCUMENT_FOLDER_CONFIG.bdds)[number]["tables"][number]["subFolders"][number];

function shouldHideGenericGeneralSubfolders(nodes: readonly DocumentFolderNode[]): boolean {
  return nodes.length === 1 && typeof nodes[0] === "string" && nodes[0].trim().toUpperCase() === "GENERAL";
}

function userLabel(user: ApiDocument["uploadedBy"] | ApiDocument["validatedBy"]): string {
  if (!user) return "—";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "—";
}

function documentStatusInfo(doc: ApiDocument): { status: string; label: string } {
  if (doc.status === "APPROVED") return { status: "validated", label: "Validé" };
  if (doc.status === "REJECTED") return { status: "rejected", label: "Refusé" };
  return { status: "under_review", label: "En attente" };
}

export function ProjectDocumentsSection({
  projectId,
  projectName,
  allowedBddCategories,
  sectionTitle,
  hideBddRootLevel = false,
}: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canUpload = user?.role === "USER";

  const [expandedBdds, setExpandedBdds] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({});
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documentDateLocal, setDocumentDateLocal] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<ApiDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ApiDocument | null>(null);

  const listQ = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({
          projectId,
          projectOnly: "true",
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

  const visibleBdds = allowedBddCategories?.length
    ? DOCUMENT_FOLDER_CONFIG.bdds.filter((bdd) => allowedBddCategories.includes(bdd.bddCategory))
    : DOCUMENT_FOLDER_CONFIG.bdds;
  const flattenSingleBdd = hideBddRootLevel && visibleBdds.length === 1;
  const docs = (listQ.data ?? []).filter(
    (d) => !allowedBddCategories?.length || allowedBddCategories.includes(d.bddCategory ?? ""),
  );
  const loading = listQ.isLoading;
  const loadError = listQ.isError;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-related", projectId] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadContext) throw new Error("Upload context missing");
      return documentsApi.uploadUnified(files, {
        projectId,
        fileKind: "REPORT",
        category: uploadContext.bddCategory,
        subCategory: uploadContext.subFolder
          ? `${uploadContext.tableName}_${uploadContext.subFolder}`
          : uploadContext.tableName,
        bddCategory: uploadContext.bddCategory,
        tableName: uploadContext.tableName,
        subFolder: uploadContext.subFolder ?? undefined,
        folderPath: documentFolderPath(
          uploadContext.bddCategory,
          uploadContext.tableName,
          uploadContext.subFolder,
        ),
        scope: "PROJECT",
        documentDate: documentDateLocal ? new Date(documentDateLocal + "T12:00:00").toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toastSuccess(files.length > 1 ? "Documents ajoutés avec succès." : "Document ajouté avec succès.");
      setUploadOpen(false);
      setFiles([]);
      setDocumentDateLocal("");
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidate();
    },
    onError: () => toastUploadError(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: (_, deletedId) => {
      toastSuccess("Document supprimé avec succès.");
      setDeleteDoc(null);
      setViewerDoc((prev) => (prev?.id === deletedId ? null : prev));
      invalidate();
    },
    onError: (e: unknown) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const [currentBDD, currentTable, ...currentSubFolderParts] = currentPath;
  const currentSubFolder = currentSubFolderParts.length ? currentSubFolderParts.join("/") : null;
  const currentPathLabel = currentPath.length ? currentPath.join(" / ") : "Aucun dossier sélectionné";

  const openUploadForFolder = (bddCategory: string, tableName: string, subFolder?: string | null) => {
    if (!canUpload) return;
    const nextPath = subFolder ? [bddCategory, tableName, ...subFolder.split("/")] : [bddCategory, tableName];
    setCurrentPath(nextPath);
    setUploadContext({ bddCategory, tableName, subFolder });
    setFileError(null);
    setUploadOpen(true);
  };

  const filesForFolder = (bddCategory: string, tableName: string, subFolder: string) =>
    docs.filter(
      (d) => d.bddCategory === bddCategory && d.tableName === tableName && d.subFolder === subFolder,
    );

  const filesForTable = (bddCategory: string, tableName: string) =>
    docs.filter(
      (d) =>
        d.bddCategory === bddCategory &&
        d.tableName === tableName &&
        (
          (!d.subFolder || !d.subFolder.trim()) ||
          d.folderPath === documentFolderPath(bddCategory, tableName)
        ),
    );

  const renderAdminMetadata = (doc: ApiDocument) => {
    const statusInfo = documentStatusInfo(doc);
    return (
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        
      <p>
        <span className="font-medium text-foreground">Depose par:</span> {userLabel(doc.uploadedBy)}
      </p>
      <p>
        <span className="font-medium text-foreground">Acteur(s) assigne(s):</span> {assignedActorsText}
      </p>
      {doc.validatedBy ? (
        <p>
          <span className="font-medium text-foreground">
            {doc.status === "REJECTED" ? "Rejete par:" : "Valide par:"}
          </span>{" "}
          {userLabel(doc.validatedBy)}
        </p>
      ) : null}
      {doc.remarks?.trim() ? (
        <p className="sm:col-span-2">
          <span className="font-medium text-foreground">Remarque:</span> {doc.remarks.trim()}
        </p>
      ) : null}
      </div>
    );
  };

  const toggleBdd = (bddCategory: string) => {
    const isOpen = Boolean(expandedBdds[bddCategory]);
    setExpandedBdds((prev) => ({ ...prev, [bddCategory]: !isOpen }));
    const nextPath = isOpen ? [] : [bddCategory];
    if (isOpen) {
      setExpandedTables({});
      setExpandedSubFolders({});
    }
    setCurrentPath(nextPath);
    console.log("CLICK", bddCategory);
    console.log("PATH", nextPath);
  };

  const toggleTable = (bddCategory: string, tableName: string) => {
    const key = `${bddCategory}::${tableName}`;
    const isOpen = Boolean(expandedTables[key]);
    setExpandedBdds((prev) => ({ ...prev, [bddCategory]: true }));
    setExpandedTables((prev) => ({ ...prev, [key]: !isOpen }));
    if (isOpen) {
      setExpandedSubFolders((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${key}::`))),
      );
    }
    const nextPath = isOpen ? [bddCategory] : [bddCategory, tableName];
    setCurrentPath(nextPath);
    console.log("CLICK", tableName);
    console.log("PATH", nextPath);
  };

  const toggleSubFolder = (bddCategory: string, tableName: string, subFolder: string) => {
    const key = `${bddCategory}::${tableName}::${subFolder}`;
    const isOpen = Boolean(expandedSubFolders[key]);
    setExpandedBdds((prev) => ({ ...prev, [bddCategory]: true }));
    setExpandedTables((prev) => ({ ...prev, [`${bddCategory}::${tableName}`]: true }));
    setExpandedSubFolders((prev) => ({ ...prev, [key]: !isOpen }));
    const nextPath = isOpen ? [bddCategory, tableName] : [bddCategory, tableName, ...subFolder.split("/")];
    setCurrentPath(nextPath);
    console.log("CLICK", subFolder.split("/").at(-1) ?? subFolder);
    console.log("PATH", nextPath);
  };

  const nodeChildren = (node: DocumentFolderNode): readonly DocumentFolderNode[] | null =>
    typeof node === "object" && node !== null && "children" in node
      ? (node.children as unknown as readonly DocumentFolderNode[])
      : null;

  const renderSubFolders = (
    nodes: readonly DocumentFolderNode[],
    bddCategory: string,
    tableName: string,
    parentPath: string[] = [],
  ) => {
    return (
      <div className="space-y-1.5">
        {nodes.map((node) => {
          const label = typeof node === "string" ? node : node.name;
          const children = nodeChildren(node);
          const fullPath = [...parentPath, label];
          const subFolder = fullPath.join("/");
          const subKey = `${bddCategory}::${tableName}::${subFolder}`;
          const subOpen = Boolean(expandedSubFolders[subKey]);
          const folderFiles = filesForFolder(bddCategory, tableName, subFolder);
          return (
            <div key={subKey} className="space-y-2" style={{ marginLeft: 16 }}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition ${
                  currentBDD === bddCategory && currentTable === tableName && currentSubFolder === subFolder
                    ? "border-primary/45 bg-primary/10"
                    : "border-border/60 bg-background hover:bg-muted/20"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSubFolder(bddCategory, tableName, subFolder);
                }}
              >
                <span className="inline-flex items-center gap-2 text-sm text-foreground">
                  <Folder className="h-4 w-4" />
                  {label}
                </span>
                {subOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {subOpen ? (
                <div className="ml-6 space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {bddCategory} / {tableName} / {subFolder}
                    </p>
                    {!isAdmin && canUpload ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          openUploadForFolder(bddCategory, tableName, subFolder);
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
                    <ul className="space-y-2">
                      {folderFiles.map((doc) => (
                        <li
                          key={doc.id}
                          role="button"
                          tabIndex={0}
                          className="group cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card/70 transition hover:border-primary/35"
                          onClick={() => setViewerDoc(doc)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setViewerDoc(doc);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{documentLabel(doc)}</p>
                              <p className="mt-0.5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{effectiveDocumentDateIso(doc) ? formatDate(effectiveDocumentDateIso(doc)!) : "—"}</span>
                                <StatusBadge status={documentStatusInfo(doc).status}>
                                  {documentStatusInfo(doc).label}
                                </StatusBadge>
                              </p>
                              {isAdmin ? renderAdminMetadata(doc) : null}
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
                                  onClick={() => setDeleteDoc(doc)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Supprimer
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {children ? renderSubFolders(children, bddCategory, tableName, fullPath) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {sectionTitle ? <h2 className="text-sm font-semibold text-foreground">{sectionTitle}</h2> : null}
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Dossier actif:{" "}
          <span className="font-medium text-foreground">{currentPathLabel}</span>
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
          <p className="font-medium text-destructive">Impossible de charger les documents.</p>
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
          {flattenSingleBdd ? (
            <div className="space-y-1.5">
              {visibleBdds[0].tables.map((table) => {
                const bdd = visibleBdds[0];
                const tableKey = `${bdd.bddCategory}::${table.tableName}`;
                const tableOpen = Boolean(expandedTables[tableKey]);
                return (
                  <div key={tableKey} className="space-y-2">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition ${
                        currentBDD === bdd.bddCategory && currentTable === table.tableName
                          ? "border-primary/35 bg-primary/5"
                          : "border-border/60 bg-white hover:bg-muted/20"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTable(bdd.bddCategory, table.tableName);
                      }}
                    >
                      <span className="inline-flex items-center gap-2 text-sm text-foreground">
                        <Folder className="h-4 w-4" />
                        {table.tableName}
                      </span>
                      {tableOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {tableOpen ? (
                      <>
                        <div className="ml-6 space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {bdd.bddCategory} / {table.tableName}
                            </p>
                            {!isAdmin && canUpload ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-2"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openUploadForFolder(bdd.bddCategory, table.tableName, null);
                                }}
                              >
                                <FilePlus2 className="h-3.5 w-3.5" />
                                Ajouter ici
                              </Button>
                            ) : null}
                          </div>
                          {filesForTable(bdd.bddCategory, table.tableName).length === 0 ? (
                            <div className="rounded-md border border-dashed border-border/70 bg-background/70 px-4 py-5 text-center text-xs text-muted-foreground">
                              Dossier vide
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {filesForTable(bdd.bddCategory, table.tableName).map((doc) => (
                                <li
                                  key={doc.id}
                                  role="button"
                                  tabIndex={0}
                                  className="group cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card/70 transition hover:border-primary/35"
                                  onClick={() => setViewerDoc(doc)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setViewerDoc(doc);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3 p-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-foreground">{documentLabel(doc)}</p>
                                      <p className="mt-0.5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{effectiveDocumentDateIso(doc) ? formatDate(effectiveDocumentDateIso(doc)!) : "—"}</span>
                                        <StatusBadge status={documentStatusInfo(doc).status}>
                                          {documentStatusInfo(doc).label}
                                        </StatusBadge>
                                      </p>
                                      {isAdmin ? renderAdminMetadata(doc) : null}
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
                                          onClick={() => setDeleteDoc(doc)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Supprimer
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {!shouldHideGenericGeneralSubfolders(table.subFolders)
                          ? renderSubFolders(table.subFolders, bdd.bddCategory, table.tableName)
                          : null}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {!flattenSingleBdd && (
            visibleBdds.map((bdd) => {
            const bddOpen = Boolean(expandedBdds[bdd.bddCategory]);
            return (
              <div key={bdd.bddCategory} className="space-y-2">
                <button
                  type="button"
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    currentBDD === bdd.bddCategory
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/90 bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleBdd(bdd.bddCategory);
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-sm text-foreground">
                    <Folder className="h-4 w-4" />
                    {bdd.label}
                  </span>
                  {bddOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {bddOpen ? (
                  <div className="space-y-1.5">
                    {bdd.tables.map((table) => {
                      const tableKey = `${bdd.bddCategory}::${table.tableName}`;
                      const tableOpen = Boolean(expandedTables[tableKey]);
                      return (
                        <div key={tableKey} className="space-y-2" style={{ marginLeft: 16 }}>
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition ${
                              currentBDD === bdd.bddCategory && currentTable === table.tableName
                                ? "border-primary/35 bg-primary/5"
                                : "border-border/60 bg-white hover:bg-muted/20"
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleTable(bdd.bddCategory, table.tableName);
                            }}
                          >
                            <span className="inline-flex items-center gap-2 text-sm text-foreground">
                              <Folder className="h-4 w-4" />
                              {table.tableName}
                            </span>
                            {tableOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>

                          {tableOpen ? (
                            <>
                              <div className="ml-6 space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {bdd.bddCategory} / {table.tableName}
                                  </p>
                                  {!isAdmin && canUpload ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 gap-2"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openUploadForFolder(bdd.bddCategory, table.tableName, null);
                                      }}
                                    >
                                      <FilePlus2 className="h-3.5 w-3.5" />
                                      Ajouter ici
                                    </Button>
                                  ) : null}
                                </div>
                                {filesForTable(bdd.bddCategory, table.tableName).length === 0 ? (
                                  <div className="rounded-md border border-dashed border-border/70 bg-background/70 px-4 py-5 text-center text-xs text-muted-foreground">
                                    Dossier vide
                                  </div>
                                ) : (
                                  <ul className="space-y-2">
                                    {filesForTable(bdd.bddCategory, table.tableName).map((doc) => (
                                      <li
                                        key={doc.id}
                                        role="button"
                                        tabIndex={0}
                                        className="group cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card/70 transition hover:border-primary/35"
                                        onClick={() => setViewerDoc(doc)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setViewerDoc(doc);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-3 p-3">
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                              {documentLabel(doc)}
                                            </p>
                                            <p className="mt-0.5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                              <span>{effectiveDocumentDateIso(doc) ? formatDate(effectiveDocumentDateIso(doc)!) : "—"}</span>
                                              <StatusBadge status={documentStatusInfo(doc).status}>
                                                {documentStatusInfo(doc).label}
                                              </StatusBadge>
                                            </p>
                                            {isAdmin ? renderAdminMetadata(doc) : null}
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
                                                onClick={() => setDeleteDoc(doc)}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Supprimer
                                              </Button>
                                            ) : null}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              {!shouldHideGenericGeneralSubfolders(table.subFolders)
                                ? renderSubFolders(table.subFolders, bdd.bddCategory, table.tableName)
                                : null}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
          )}
        </div>
      )}

      <DocumentViewerDialog
        doc={viewerDoc}
        onOpenChange={(open) => !open && setViewerDoc(null)}
        showEffectiveDate
      />

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des documents"
        description={
          <>
            Enregistrement pour le projet <strong className="text-foreground">{projectName}</strong>.
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
                  setFileError("Choisissez au moins un fichier.");
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
            <Label htmlFor="pd-file">Fichiers *</Label>
            <Input
              id="pd-file"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pd-doc-date">Date du document (optionnel)</Label>
            <Input
              id="pd-doc-date"
              type="date"
              value={documentDateLocal}
              onChange={(e) => setDocumentDateLocal(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Chemin sélectionné:{" "}
            <span className="font-medium text-foreground">
              {uploadContext
                ? uploadContext.subFolder
                  ? `${uploadContext.bddCategory} / ${uploadContext.tableName} / ${uploadContext.subFolder}`
                  : `${uploadContext.bddCategory} / ${uploadContext.tableName}`
                : "—"}
            </span>
          </p>
          {fileError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
              {fileError}
            </p>
          ) : null}
        </div>
      </EntityFormModal>

      <Dialog open={Boolean(deleteDoc)} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce document ?</DialogTitle>
            <DialogDescription className="text-left">
              « {deleteDoc ? documentLabel(deleteDoc) : ""} » sera retiré de la bibliothèque projet.
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
