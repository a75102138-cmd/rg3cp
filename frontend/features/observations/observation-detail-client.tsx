"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StickyPageToolbar } from "@/components/shared/sticky-page-toolbar";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSummaryCard } from "@/components/shared/detail-summary-card";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { RelatedSectionToolbar } from "@/components/shared/related-section-toolbar";
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
import { MultiSelectPopover } from "@/components/shared/multi-select-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { decisionsApi, documentsApi, observationsApi, pathologiesApi, photosApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import { formatDate } from "@/lib/format";
import {
  DOCTRINAL_PRINCIPLES_OPTIONS,
  parseDoctrinalPrinciples,
} from "@/lib/labels/doctrinal-principles-fr";
import { segmentIdFromParams } from "@/lib/route-params";
import type { ApiDecision, ApiObservationDetail, ApiPathology } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Gavel, ImageIcon, Loader2, Microscope, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const OBS_LABEL: Record<string, string> = {
  SITE_VISUAL: "Visite visuelle",
  MEASURE: "Mesure",
  CONDITION_SURVEY: "État des lieux",
  MONITORING: "Suivi",
  PRE_INTERVENTION: "Pré-intervention",
  POST_INTERVENTION: "Post-intervention",
  MEETING_NOTE: "Compte-rendu",
  OTHER: "Autre",
};

const SEV_LABEL: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
};

const PATH_TYPES = [
  "CRACKING",
  "MOISTURE",
  "SALT_ATTACK",
  "DETACHMENT",
  "BIOLOGICAL_GROWTH",
  "MATERIAL_LOSS",
  "DEFORMATION",
  "CORROSION",
  "COATING_FAILURE",
  "OTHER",
] as const;

const PATH_LABEL: Record<string, string> = {
  CRACKING: "Fissuration",
  MOISTURE: "Humidité",
  SALT_ATTACK: "Attaque des sels",
  DETACHMENT: "Décollement",
  BIOLOGICAL_GROWTH: "Développement biologique",
  MATERIAL_LOSS: "Perte de matière",
  DEFORMATION: "Déformation",
  CORROSION: "Corrosion",
  COATING_FAILURE: "Dégradation de revêtement",
  OTHER: "Autre",
};

const DEC_TYPES = [
  "CONSERVATION_APPROACH",
  "INTERVENTION_PRINCIPLE",
  "MATERIAL_CHOICE",
  "METHODOLOGY",
  "VALIDATION_PV",
  "REGULATORY",
  "OTHER",
] as const;

const DEC_TYPE_LABEL: Record<string, string> = {
  CONSERVATION_APPROACH: "Approche de conservation",
  INTERVENTION_PRINCIPLE: "Principe d’intervention",
  MATERIAL_CHOICE: "Choix des matériaux",
  METHODOLOGY: "Méthodologie",
  VALIDATION_PV: "Validation / PV",
  REGULATORY: "Réglementaire",
  OTHER: "Autre",
};

const DEC_STATUS = ["DRAFT", "PROPOSED", "APPROVED", "SUPERSEDED", "CANCELLED"] as const;
const DEC_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PROPOSED: "Proposée",
  APPROVED: "Approuvée",
  SUPERSEDED: "Remplacée",
  CANCELLED: "Annulée",
};

const PHOTO_PHASES = [
  { value: "AVANT", label: "Avant" },
  { value: "PENDANT", label: "Pendant" },
  { value: "APRES", label: "Après" },
] as const;
const PHOTO_PHASE_LABEL: Record<string, string> = Object.fromEntries(
  PHOTO_PHASES.map((p) => [p.value, p.label]),
);
const PHOTO_TYPES = [
  { value: "VUE_ENSEMBLE", label: "Vue d’ensemble" },
  { value: "DETAIL_PATHOLOGIE", label: "Détail pathologie" },
  { value: "DETAIL_INTERVENTION", label: "Détail intervention" },
  { value: "COMPARATIF_AVANT_APRES", label: "Comparatif avant/après" },
  { value: "AUTRE", label: "Autre" },
];
const PHOTO_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PHOTO_TYPES.map((t) => [t.value, t.label]),
);
const DOCUMENT_TYPE_OPTIONS = [
  { value: "REPORT", label: "Rapport" },
  { value: "SCAN", label: "Numérisation" },
  { value: "DRAWING", label: "Dessin" },
  { value: "NOTE", label: "Note" },
  { value: "MINUTES_PV", label: "Procès-verbal (PV)" },
  { value: "CONTRACT", label: "Contrat" },
  { value: "LAB_REPORT", label: "Rapport de laboratoire" },
  { value: "CERTIFICATE", label: "Certificat" },
  { value: "CORRESPONDENCE", label: "Correspondance" },
  { value: "CPS", label: "CPS" },
  { value: "PLAN", label: "Plan" },
  { value: "FICHE_TECHNIQUE", label: "Fiche technique" },
  { value: "PLANNING", label: "Planning" },
  { value: "OTHER", label: "Autre" },
] as const;
const DOCUMENT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((x) => [x.value, x.label]),
);

export function ObservationDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = segmentIdFromParams(params);
  const hasObservationId = id.length > 0;
  const qc = useQueryClient();

  const obsQ = useQuery({
    queryKey: ["observation", id],
    queryFn: () => observationsApi.get(id),
    enabled: hasObservationId,
  });

  const [tab, setTab] = useState("photos");
  const [photoPhase, setPhotoPhase] = useState("__none__");
  const [photoType, setPhotoType] = useState("__none__");
  const [photoTypeError, setPhotoTypeError] = useState<string | null>(null);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docKind, setDocKind] = useState("REPORT");
  const [docKindError, setDocKindError] = useState<string | null>(null);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const [pathOpen, setPathOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<ApiPathology | null>(null);
  const [pType, setPType] = useState<string>("CRACKING");
  const [pSev, setPSev] = useState<string>("__none__");
  const [pName, setPName] = useState("");
  const [pNameError, setPNameError] = useState<string | null>(null);
  const [pSevError, setPSevError] = useState<string | null>(null);
  const [pDesc, setPDesc] = useState("");
  const [dTitleError, setDTitleError] = useState<string | null>(null);

  const [decOpen, setDecOpen] = useState(false);
  const [editingDec, setEditingDec] = useState<ApiDecision | null>(null);
  const [dTitle, setDTitle] = useState("");
  const [dType, setDType] = useState<string>("CONSERVATION_APPROACH");
  const [dStatus, setDStatus] = useState<string>("DRAFT");
  const [dPrinciples, setDPrinciples] = useState<Set<string>>(new Set());
  const [dJust, setDJust] = useState("");
  const [dDesc, setDDesc] = useState("");
  const [dPathId, setDPathId] = useState<string>("__none__");

  const [delPath, setDelPath] = useState<ApiPathology | null>(null);
  const [delDec, setDelDec] = useState<ApiDecision | null>(null);
  const [confirmDelObs, setConfirmDelObs] = useState(false);

  const invalidateObs = () => qc.invalidateQueries({ queryKey: ["observation", id] });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      if (photoType === "__none__") {
        throw new Error("Sélectionnez un type de photo.");
      }
      if (photoPhase === "__none__") {
        throw new Error("Sélectionnez une phase chantier.");
      }
      return photosApi.uploadObservation(files, id, photoPhase, photoType);
    },
    onSuccess: async () => {
      toastSuccess("Photo(s) envoyée(s) avec succès.");
      await invalidateObs();
      setUploading(false);
      setPhotoUploadOpen(false);
      setPhotoFiles([]);
      setPhotoTypeError(null);
    },
    onError: () => {
      toastUploadError();
      setUploading(false);
    },
  });

  const uploadDocMut = useMutation({
    mutationFn: async (files: File[]) => documentsApi.uploadObservation(files, id, docKind),
    onSuccess: async () => {
      toastSuccess("Document(s) envoyé(s) avec succès.");
      await invalidateObs();
      setUploadingDocs(false);
      setDocUploadOpen(false);
      setDocFiles([]);
      setDocKindError(null);
    },
    onError: () => {
      toastUploadError();
      setUploadingDocs(false);
    },
  });

  const savePathMut = useMutation({
    mutationFn: async () => {
      const o = obsQ.data;
      if (!o) throw new Error("...");
      const body = {
        zoneId: o.zoneId,
        observationId: o.id,
        elementId: o.elementId ?? undefined,
        name: pName.trim(),
        pathologyType: pType,
        severity: pSev === "__none__" ? undefined : pSev,
        description: pDesc.trim() || undefined,
      };
      if (editingPath) return pathologiesApi.update(editingPath.id, body);
      return pathologiesApi.create(body);
    },
    onSuccess: async () => {
      toastSuccess(editingPath ? "Pathologie enregistrée avec succès." : "Pathologie créée avec succès.");
      setPathOpen(false);
      await invalidateObs();
    },
    onError: (e) => toastMutationError(e),
  });

  const delPathMut = useMutation({
    mutationFn: (pid: string) => pathologiesApi.remove(pid),
    onSuccess: async () => {
      toastSuccess("Pathologie supprimée avec succès.");
      setDelPath(null);
      await invalidateObs();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const saveDecMut = useMutation({
    mutationFn: async () => {
      const o = obsQ.data;
      if (!o) throw new Error("...");
      const title = dTitle.trim();
      const body = {
        zoneId: o.zoneId,
        observationId: o.id,
        pathologyId: dPathId === "__none__" ? undefined : dPathId,
        title,
        decisionType: dType,
        status: dStatus,
        doctrinalPrinciples: dPrinciples.size > 0 ? Array.from(dPrinciples) : undefined,
        justification: dJust.trim() || undefined,
        description: dDesc.trim() || undefined,
      };
      if (editingDec) return decisionsApi.update(editingDec.id, body);
      return decisionsApi.create(body);
    },
    onSuccess: async () => {
      toastSuccess(editingDec ? "Décision enregistrée avec succès." : "Décision créée avec succès.");
      setDecOpen(false);
      setDTitleError(null);
      await invalidateObs();
    },
    onError: (e) => toastMutationError(e),
  });

  const delDecMut = useMutation({
    mutationFn: (did: string) => decisionsApi.remove(did),
    onSuccess: async () => {
      toastSuccess("Décision supprimée avec succès.");
      setDelDec(null);
      await invalidateObs();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const delObsMut = useMutation({
    mutationFn: async () => {
      const snap = qc.getQueryData<ApiObservationDetail>(["observation", id]);
      await observationsApi.remove(id);
      return snap;
    },
    onSuccess: async (snap) => {
      setConfirmDelObs(false);
      const eid = snap?.elementId;
      const zid = snap?.zoneId;
      if (eid) router.push(`/elements/${eid}`);
      else if (zid) router.push(`/zones/${zid}`);
      else router.push("/observations");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const photoDelMut = useMutation({
    mutationFn: (pid: string) => photosApi.remove(pid),
    onSuccess: async () => {
      toastSuccess("Photo supprimée avec succès.");
      await invalidateObs();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const openCreatePath = () => {
    setEditingPath(null);
    setPType("CRACKING");
    setPSev("MEDIUM");
    setPName("");
    setPNameError(null);
    setPSevError(null);
    setPDesc("");
    setPathOpen(true);
  };

  const openEditPath = (p: ApiPathology) => {
    setEditingPath(p);
    setPType(p.pathologyType);
    setPSev(p.severity ?? "__none__");
    setPName(p.name ?? "");
    setPNameError(null);
    setPSevError(null);
    setPDesc(p.description ?? "");
    setPathOpen(true);
  };

  const openCreateDec = () => {
    setEditingDec(null);
    setDTitle("");
    setDType("CONSERVATION_APPROACH");
    setDStatus("DRAFT");
    setDPrinciples(new Set());
    setDJust("");
    setDDesc("");
    setDPathId("__none__");
    setDTitleError(null);
    setDecOpen(true);
  };

  const openEditDec = (d: ApiDecision) => {
    setEditingDec(d);
    setDTitle(d.title);
    setDType(d.decisionType);
    setDStatus(d.status);
    setDPrinciples(new Set(parseDoctrinalPrinciples(d.doctrinalPrinciples)));
    setDJust(d.justification ?? "");
    setDDesc(d.description ?? "");
    setDPathId(d.pathologyId ?? "__none__");
    setDTitleError(null);
    setDecOpen(true);
  };

  if (!hasObservationId) {
    return (
      <p className="text-sm text-muted-foreground">
        Identifiant d’observation absent de l’URL. Vérifiez le lien ou retournez en arrière.{" "}
        <Button variant="link" className="px-0" onClick={() => router.back()}>
          Retour
        </Button>
      </p>
    );
  }

  // TanStack Query v5 : `isLoading` = isPending && isFetching — ne couvre pas tout le chargement initial.
  if (obsQ.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3 max-w-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (obsQ.isError) {
    const status = obsQ.error instanceof ApiError ? obsQ.error.status : 0;
    const is404 = status === 404;
    return (
      <div className="space-y-3 text-sm">
        <p className={is404 ? "text-muted-foreground" : "text-destructive"}>
          {is404
            ? "Observation introuvable (aucune donnée pour cet identifiant)."
            : "Impossible de charger l’observation. Vérifiez que l’API est joignable."}
        </p>
        {!is404 && obsQ.error instanceof ApiError ? (
          <p className="text-xs text-muted-foreground">{TOAST_MSG.loadFailed}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => obsQ.refetch()}>
            Réessayer
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const o = obsQ.data;
  if (!o) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3 max-w-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }
  const project = o.zone?.project;
  const zone = o.zone;
  const element = o.element;
  const photos = o.photos ?? [];
  const documents = o.documents ?? [];
  const paths = o.pathologies ?? [];
  const decs = o.decisions ?? [];

  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
            { label: "Zones", href: project ? `/projects/${project.id}` : "/zones" },
            ...(zone ? [{ label: zone.name, href: `/zones/${zone.id}?tab=elements` }] : []),
            ...(element
              ? [
                  { label: "Éléments", href: `/zones/${zone?.id}?tab=elements` },
                  { label: element.name, href: `/elements/${element.id}` },
                ]
              : []),
            { label: "Observations", href: element ? `/elements/${element.id}` : zone ? `/zones/${zone.id}` : "/observations" },
            { label: o.title },
          ]}
        />
      </StickyPageToolbar>

      <DetailHeader
        code={<span className="font-mono">{o.code}</span>}
        title={o.title}
        description={o.description ?? undefined}
        badges={
          <>
            <span className="inline-flex rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
              {OBS_LABEL[o.observationType] ?? o.observationType}
            </span>
            {o.severity ? (
              <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                {SEV_LABEL[o.severity] ?? o.severity}
              </span>
            ) : null}
            {o.observedAt ? (
              <span className="inline-flex rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                {formatDate(o.observedAt)}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/observations/${o.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button type="button" variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDelObs(true)}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </>
        }
      />

      <DetailSummaryCard title="Contexte">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Projet</p>
            {project ? (
              <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                {project.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Zone</p>
            {zone ? (
              <Link href={`/zones/${zone.id}`} className="font-medium text-primary hover:underline">
                {zone.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Élément</p>
            {element ? (
              <Link href={`/elements/${element.id}`} className="font-medium text-primary hover:underline">
                {element.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Auteur</p>
            <p className="font-medium">{o.authorName ?? "—"}</p>
          </div>
        </div>
      </DetailSummaryCard>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="photos" className="gap-1.5">
            <ImageIcon className="h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="pathologies" className="gap-1.5">
            <Microscope className="h-4 w-4" />
            Pathologies
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-1.5">
            <Gavel className="h-4 w-4" />
            Décisions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button
                type="button"
                className="w-fit gap-1.5"
                disabled={uploading}
                onClick={() => {
                  setPhotoTypeError(null);
                  setPhotoUploadOpen(true);
                }}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ajouter des photos
              </Button>
            }
          />
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune photo pour cette observation.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((ph) => (
                <div
                  key={ph.id}
                  className="group relative overflow-hidden rounded-lg border bg-card"
                >
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => setViewerUrl(ph.secureUrl ?? ph.url ?? null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ph.secureUrl ?? ph.url ?? ""}
                      alt={ph.title ?? ""}
                      className="h-44 w-full object-cover transition-opacity group-hover:opacity-95"
                    />
                  </button>
                  <div className="flex items-start justify-between gap-2 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{ph.title ?? ph.originalFilename}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {PHOTO_PHASE_LABEL[ph.photoPhase ?? ""] ?? ph.photoPhase ?? "—"} ·{" "}
                        {PHOTO_TYPE_LABEL[ph.photoType ?? ""] ?? ph.photoType ?? "—"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 text-destructive"
                      onClick={() => photoDelMut.mutate(ph.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button
                type="button"
                className="w-fit gap-1.5"
                disabled={uploadingDocs}
                onClick={() => {
                  setDocKindError(null);
                  setDocUploadOpen(true);
                }}
              >
                {uploadingDocs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ajouter des documents
              </Button>
            }
          />
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document pour cette observation.</p>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title ?? doc.originalFilename ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {DOCUMENT_TYPE_LABEL[doc.fileKind ?? ""] ?? doc.fileKind ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.createdAt ? formatDate(doc.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.secureUrl || doc.url ? (
                          <Button type="button" variant="ghost" size="sm" asChild>
                            <a href={doc.secureUrl ?? doc.url} target="_blank" rel="noopener noreferrer">
                              Ouvrir
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pathologies" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" size="sm" className="w-fit gap-1.5" onClick={openCreatePath}>
                <Plus className="h-4 w-4" />
                Ajouter une pathologie
              </Button>
            }
          />
          {paths.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune pathologie liée à cette observation.
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom pathologie</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Gravité</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paths.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/pathologies/${p.id}`)}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-medium">
                        {PATH_LABEL[p.pathologyType] ?? p.pathologyType}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.severity ? SEV_LABEL[p.severity] ?? p.severity : "—"}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                        {p.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPath(p);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDelPath(p);
                          }}
                        >
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
        </TabsContent>

        <TabsContent value="decisions" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" size="sm" className="w-fit gap-1.5" onClick={openCreateDec}>
                <Plus className="h-4 w-4" />
                Ajouter une décision
              </Button>
            }
          />
          {decs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune décision liée à cette observation.
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Principe</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decs.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/decisions/${d.id}`)}
                    >
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell className="text-sm">{DEC_TYPE_LABEL[d.decisionType] ?? d.decisionType}</TableCell>
                      <TableCell className="text-sm">{DEC_STATUS_LABEL[d.status] ?? d.status}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.decidedAt ? formatDate(d.decidedAt) : "—"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {parseDoctrinalPrinciples(d.doctrinalPrinciples).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDec(d);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDelDec(d);
                          }}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EntityFormModal
        open={photoUploadOpen}
        onOpenChange={setPhotoUploadOpen}
        title="Ajouter des photos"
        description={`Observation ${o.code} — type de photo requis.`}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPhotoUploadOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={uploading}
              onClick={() => {
                if (photoPhase === "__none__") {
                  setPhotoTypeError("La phase chantier est obligatoire.");
                  return;
                }
                if (photoType === "__none__") {
                  setPhotoTypeError("Le type de photo est obligatoire.");
                  return;
                }
                if (!photoFiles.length) {
                  setPhotoTypeError("Choisissez au moins une photo.");
                  return;
                }
                setPhotoTypeError(null);
                setUploading(true);
                uploadMut.mutate(photoFiles);
              }}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Phase chantier *</Label>
            <Select
              value={photoPhase}
              onValueChange={(v) => {
                setPhotoPhase(v);
                if (v !== "__none__") setPhotoTypeError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sélectionner une phase</SelectItem>
                {PHOTO_PHASES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type de photo *</Label>
            <Select
              value={photoType}
              onValueChange={(v) => {
                setPhotoType(v);
                if (v !== "__none__") setPhotoTypeError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sélectionner un type</SelectItem>
                {PHOTO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fichier(s) *</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPhotoFiles(files);
                if (files.length) setPhotoTypeError(null);
              }}
            />
            {photoFiles.length ? (
              <p className="text-xs text-muted-foreground">
                {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""} sélectionnée
                {photoFiles.length > 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>
          {photoTypeError ? <p className="text-sm text-destructive">{photoTypeError}</p> : null}
        </div>
      </EntityFormModal>

      <EntityFormModal
        open={docUploadOpen}
        onOpenChange={setDocUploadOpen}
        title="Ajouter des documents"
        description={`Observation ${o.code} — upload de documents contextuels.`}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDocUploadOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={uploadingDocs}
              onClick={() => {
                if (!docKind) {
                  setDocKindError("Le type de document est obligatoire.");
                  return;
                }
                if (!docFiles.length) {
                  setDocKindError("Choisissez au moins un document.");
                  return;
                }
                setDocKindError(null);
                setUploadingDocs(true);
                uploadDocMut.mutate(docFiles);
              }}
            >
              {uploadingDocs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Type de document *</Label>
            <Select
              value={docKind}
              onValueChange={(v) => {
                setDocKind(v);
                setDocKindError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fichier(s) *</Label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setDocFiles(files);
                if (files.length) setDocKindError(null);
              }}
            />
            {docFiles.length ? (
              <p className="text-xs text-muted-foreground">
                {docFiles.length} document{docFiles.length > 1 ? "s" : ""} sélectionné
                {docFiles.length > 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>
          {docKindError ? <p className="text-sm text-destructive">{docKindError}</p> : null}
        </div>
      </EntityFormModal>

      <EntityFormModal
        open={pathOpen}
        onOpenChange={setPathOpen}
        title={editingPath ? "Modifier la pathologie" : "Nouvelle pathologie"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setPathOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!pName.trim()) {
                  setPNameError("Le nom pathologie est obligatoire.");
                  return;
                }
                if (pSev === "__none__") {
                  setPSevError("La gravité est obligatoire.");
                  return;
                }
                setPNameError(null);
                setPSevError(null);
                savePathMut.mutate();
              }}
              disabled={savePathMut.isPending}
            >
              {savePathMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Observation, zone et élément : contexte automatique.</p>
            <div className="space-y-2">
              <Label>Nom pathologie *</Label>
              <Input
                value={pName}
                onChange={(e) => {
                  setPName(e.target.value);
                  if (pNameError) setPNameError(null);
                }}
                maxLength={255}
                aria-invalid={Boolean(pNameError)}
              />
              {pNameError ? <p className="text-sm text-destructive">{pNameError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Type de pathologie *</Label>
              <Select value={pType} onValueChange={setPType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATH_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PATH_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravité *</Label>
              <Select value={pSev} onValueChange={setPSev}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEV_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pSevError ? <p className="text-sm text-destructive">{pSevError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3} />
            </div>
          </div>
      </EntityFormModal>

      <EntityFormModal
        open={decOpen}
        onOpenChange={setDecOpen}
        title={editingDec ? "Modifier la décision" : "Nouvelle décision"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDecOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!dTitle.trim()) {
                  setDTitleError("Le titre est obligatoire.");
                  return;
                }
                setDTitleError(null);
                saveDecMut.mutate();
              }}
              disabled={saveDecMut.isPending}
            >
              {saveDecMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Zone et observation : contexte automatique.</p>
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={dTitle}
                onChange={(e) => {
                  setDTitle(e.target.value);
                  if (dTitleError) setDTitleError(null);
                }}
                maxLength={500}
                aria-invalid={Boolean(dTitleError)}
              />
              {dTitleError ? <p className="text-sm text-destructive">{dTitleError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Type de décision *</Label>
              <Select value={dType} onValueChange={setDType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DEC_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select value={dStatus} onValueChange={setDStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEC_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEC_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pathologie liée (optionnel)</Label>
              <Select value={dPathId} onValueChange={setDPathId}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {paths.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {PATH_LABEL[p.pathologyType] ?? p.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Principes doctrinaux</Label>
              <MultiSelectPopover
                items={DOCTRINAL_PRINCIPLES_OPTIONS.map((p) => ({ id: p, label: p }))}
                selected={dPrinciples}
                onToggle={(id) =>
                  setDPrinciples((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                placeholder="Sélectionner un ou plusieurs principes"
                emptyMessage="Aucun principe disponible."
                summary={(n) => (n === 1 ? "1 principe sélectionné" : `${n} principes sélectionnés`)}
              />
            </div>
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea value={dJust} onChange={(e) => setDJust(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={dDesc} onChange={(e) => setDDesc(e.target.value)} rows={2} />
            </div>
          </div>
      </EntityFormModal>

      <Dialog open={Boolean(delPath)} onOpenChange={(x) => !x && setDelPath(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette pathologie ?</DialogTitle>
            <DialogDescription className="text-left">
              Les documents et médias rattachés à cette pathologie seront supprimés. Les décisions qui y étaient liées
              restent en place : le lien vers la pathologie sera simplement retiré (pas de suppression des décisions).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelPath(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => delPath && delPathMut.mutate(delPath.id)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(delDec)} onOpenChange={(x) => !x && setDelDec(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette décision ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : les documents et risques liés à cette décision, ainsi que toutes les
              interventions rattachées (avec leurs documents, médias et risques), seront également supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelDec(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => delDec && delDecMut.mutate(delDec.id)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelObs} onOpenChange={setConfirmDelObs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette observation ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : les pathologies rattachées à cette observation (et leurs documents / médias),
              les décisions liées à cette observation, ainsi que les documents et médias au niveau observation seront
              supprimés en cascade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelObs(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={delObsMut.isPending} onClick={() => delObsMut.mutate()}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewerUrl)} onOpenChange={(x) => !x && setViewerUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {viewerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewerUrl} alt="" className="max-h-[75vh] w-full rounded-md object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
