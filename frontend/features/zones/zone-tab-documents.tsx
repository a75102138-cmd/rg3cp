"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { documentsApi, fetchAllPages } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import { formatDate } from "@/lib/format";
import type { ApiDocument, ApiProject, ApiZone } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { labelForFileKind, PROJECT_DOCUMENT_TYPE_OPTIONS } from "@/features/projects/document-file-kinds";

function previewKind(doc: ApiDocument): "pdf" | "image" | "other" {
  const mime = (doc.mimeType ?? "").toLowerCase();
  const fmt = (doc.format ?? "").toLowerCase();
  if (mime === "application/pdf" || fmt === "pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  return "other";
}

type Props = { zone: ApiZone; project: ApiProject };

export function ZoneTabDocuments({ zone, project }: Props) {
  const qc = useQueryClient();
  const zoneId = zone.id;
  const projectId = project.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const listQ = useQuery({
    queryKey: ["zone-documents", zoneId],
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({
          zoneId,
          zoneOnly: "true",
          projectId,
          limit: 100,
          page,
        }),
      ),
    enabled: Boolean(zoneId),
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileKind, setFileKind] = useState<string>("REPORT");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [viewer, setViewer] = useState<ApiDocument | null>(null);
  const [edit, setEdit] = useState<ApiDocument | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [del, setDel] = useState<ApiDocument | null>(null);

  const uploadMut = useMutation({
    mutationFn: async () => documentsApi.uploadZone(files, zoneId, fileKind),
    onSuccess: async () => {
      const n = files.length;
      toastSuccess(n > 1 ? `${n} documents ajoutés avec succès.` : "Document ajouté avec succès.");
      setUploadOpen(false);
      setFiles([]);
      setFileError(null);
      if (fileRef.current) fileRef.current.value = "";
      await qc.invalidateQueries({ queryKey: ["zone-documents", zoneId] });
      await qc.invalidateQueries({ queryKey: ["zone", zoneId] });
    },
    onError: () => toastUploadError(),
  });

  const saveEditMut = useMutation({
    mutationFn: () => documentsApi.update(edit!.id, { title: editTitle.trim() || null }),
    onSuccess: async () => {
      toastSuccess("Document enregistré avec succès.");
      setEdit(null);
      await qc.invalidateQueries({ queryKey: ["zone-documents", zoneId] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: async () => {
      toastSuccess("Document supprimé avec succès.");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["zone-documents", zoneId] });
      await qc.invalidateQueries({ queryKey: ["zone", zoneId] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const rows = listQ.data ?? [];
  const src = viewer?.secureUrl ?? viewer?.url ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Documents directement liés à la zone (pas les documents projet global).
        </p>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setFileError(null);
            setUploadOpen(true);
          }}
        >
          <FilePlus2 className="h-4 w-4" />
          Ajouter un document
        </Button>
      </div>

      {listQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">Aucun document lié à cette zone</p>
          <p className="mt-1 text-sm text-muted-foreground">Dépôt sous rg3cp/{project.code}/zones/{zone.code}/documents/…</p>
          <Button
            type="button"
            className="mt-6 gap-1.5"
            onClick={() => {
              setFileError(null);
              setUploadOpen(true);
            }}
          >
            <FilePlus2 className="h-4 w-4" />
            Ajouter un document
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title ?? d.originalFilename ?? "—"}</TableCell>
                  <TableCell className="text-sm">{labelForFileKind(d.fileKind)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.createdAt ? formatDate(d.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => setViewer(d)}>
                      <Eye className="h-3.5 w-3.5" />
                      Ouvrir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setEdit(d);
                        setEditTitle(d.title?.trim() ?? "");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(d)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EntityFormModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Ajouter des documents"
        description={`Zone ${zone.code} — le titre de chaque document sera dérivé du nom de fichier.`}
        size="sm"
        variant="simple"
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
                  setFileError("Choisissez au moins un fichier.");
                  return;
                }
                setFileError(null);
                uploadMut.mutate();
              }}
            >
              {uploadMut.isPending ? (
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
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select value={fileKind} onValueChange={setFileKind}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            ref={fileRef}
            type="file"
            multiple
            onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : [];
              setFiles(selected);
              if (selected.length) setFileError(null);
            }}
          />
          {files.length ? (
            <ul className="max-h-28 space-y-1 overflow-auto rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-xs text-foreground">
              {files.map((f) => (
                <li key={`${f.name}-${f.lastModified}`} className="truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          ) : null}
          {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
        </div>
      </EntityFormModal>

      <Dialog open={Boolean(viewer)} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent variant="viewer" className="max-w-4xl">
          <div className="flex max-h-[min(85vh,800px)] min-h-0 flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle className="line-clamp-2">{viewer?.title ?? viewer?.originalFilename}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto">
              {viewer && previewKind(viewer) === "pdf" && src ? (
                <iframe title="pdf" src={src} className="h-[min(72vh,640px)] w-full rounded-md border" />
              ) : viewer && previewKind(viewer) === "image" && src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="max-h-[72vh] w-auto max-w-full rounded-md" />
              ) : (
                <p className="text-sm text-muted-foreground">Aperçu non disponible.</p>
              )}
            </div>
            {src ? (
              <div className="shrink-0 pt-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEdit(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => edit && saveEditMut.mutate()} disabled={saveEditMut.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(del)} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce document ?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDel(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => del && deleteMut.mutate(del.id)}
            >
              {deleteMut.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
