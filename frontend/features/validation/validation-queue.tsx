"use client";

import { DocumentViewerDialog } from "@/components/shared/document-viewer-dialog";
import { PhotoViewerDialog } from "@/components/shared/photo-viewer-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documentsApi, fetchAllPages, photosApi } from "@/lib/api/resources";
import { useAuth } from "@/providers/auth-provider";
import { useProjectContext } from "@/providers/project-context";
import type { ApiDocument, ApiPhoto } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

function truncateDocumentTitle(value: string, maxLength = 35): string {
  const clean = (value || "").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

function truncatePath(value: string, maxLength = 55): string {
  const clean = (value || "").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

export function ValidationQueue() {
  const { projectId } = useProjectContext();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "all">("PENDING");
  const [category, setCategory] = useState("all");
  const [viewerDoc, setViewerDoc] = useState<ApiDocument | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState<ApiPhoto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ kind: "document" | "photo"; id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isActeur = user?.role === "ACTEUR";

  const docsQ = useQuery({
    queryKey: ["validation", "docs", projectId],
    enabled: Boolean(
      projectId &&
        (isAdmin || isActeur),
    ),
    queryFn: () =>
      fetchAllPages((page) =>
        documentsApi.list({ projectId, status: "PENDING", limit: 50, page }),
      ),
  });
  const photosQ = useQuery({
    queryKey: ["validation", "photos", projectId],
    enabled: Boolean(
      projectId &&
        (isAdmin || isActeur),
    ),
    queryFn: () =>
      fetchAllPages((page) => photosApi.list({ projectId, status: "PENDING", limit: 50, page })),
  });

  const rows = useMemo(
    () => [
      ...(docsQ.data ?? []).map((d) => ({
        kind: "document" as const,
        id: d.id,
        title: d.title || d.originalFilename || d.id,
        category: d.folderPath || [d.bddCategory, d.tableName, d.subFolder].filter(Boolean).join(" / ") || d.category || "—",
        status: (d.status || "PENDING") as "PENDING" | "APPROVED" | "REJECTED",
        raw: d,
      })),
      ...(photosQ.data ?? []).map((p) => ({
        kind: "photo" as const,
        id: p.id,
        title: p.title || p.originalFilename || p.id,
        category: p.folderPath || [p.bddCategory, p.tableName, p.subFolder].filter(Boolean).join(" / ") || p.category || "—",
        status: (p.status || "PENDING") as "PENDING" | "APPROVED" | "REJECTED",
        raw: p,
      })),
    ],
    [docsQ.data, photosQ.data],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort(),
    [rows],
  );
  const filteredRows = rows
    .filter((r) => (status === "all" ? true : r.status === status))
    .filter((r) => (category === "all" ? true : r.category === category))
    .sort((a, b) => a.title.localeCompare(b.title));

  const statusView = (s: "PENDING" | "APPROVED" | "REJECTED") => {
    if (s === "APPROVED") return { label: "Validé", badge: "validated" };
    if (s === "REJECTED") return { label: "Refusé", badge: "rejected" };
    return { label: "En attente", badge: "under_review" };
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["validation"] });
    qc.invalidateQueries({ queryKey: ["documents"] });
    qc.invalidateQueries({ queryKey: ["photos"] });
  };

  const approveMut = useMutation({
    mutationFn: async (row: { kind: "document" | "photo"; id: string }) =>
      row.kind === "document"
        ? documentsApi.approve(row.id)
        : photosApi.approve(row.id),
    onSuccess: refresh,
  });
  const rejectMut = useMutation({
    mutationFn: async (row: { kind: "document" | "photo"; id: string; reason: string }) =>
      row.kind === "document"
        ? documentsApi.reject(row.id, row.reason)
        : photosApi.reject(row.id, row.reason),
    onSuccess: () => {
      setRejectTarget(null);
      setRejectReason("");
      refresh();
    },
  });

  if (!projectId) return <p className="text-sm text-muted-foreground">Sélectionnez un projet.</p>;
  if (!isAdmin && !isActeur) {
    return <p className="text-sm text-muted-foreground">Validation réservée aux acteurs et administrateurs.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="APPROVED">APPROVED</SelectItem>
            <SelectItem value="REJECTED">REJECTED</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fichier en attente de validation.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Chemin</TableHead>
                <TableHead>Statut</TableHead>
                {!isAdmin ? <TableHead className="text-center">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r) => {
                const statusUi = statusView(r.status);
                return (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell
                      className="max-w-[260px] cursor-pointer truncate font-medium"
                      title={r.title}
                      onClick={() => (r.kind === "document" ? setViewerDoc(r.raw) : setViewerPhoto(r.raw))}
                    >
                      {truncateDocumentTitle(r.title)}
                    </TableCell>
                    <TableCell className="max-w-[420px] truncate" title={r.category}>
                      {truncatePath(r.category)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusUi.badge}>{statusUi.label}</StatusBadge>
                    </TableCell>
                    {!isAdmin ? (
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMut.mutate(r)}
                            disabled={approveMut.isPending || rejectMut.isPending}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectTarget({ kind: r.kind, id: r.id, title: r.title })}
                            disabled={approveMut.isPending || rejectMut.isPending}
                          >
                            Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentViewerDialog doc={viewerDoc} onOpenChange={(open) => !open && setViewerDoc(null)} showEffectiveDate />
      <PhotoViewerDialog photo={viewerPhoto} onOpenChange={(open) => !open && setViewerPhoto(null)} showEffectiveDate />

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer le rejet</DialogTitle>
            <DialogDescription className="text-left">
              {rejectTarget ? `Vous allez rejeter « ${rejectTarget.title} ».` : "Confirmez le rejet."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Remarque obligatoire (raison du rejet)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!rejectTarget || !rejectReason.trim() || rejectMut.isPending}
              onClick={() =>
                rejectTarget &&
                rejectMut.mutate({
                  kind: rejectTarget.kind,
                  id: rejectTarget.id,
                  reason: rejectReason.trim(),
                })
              }
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
