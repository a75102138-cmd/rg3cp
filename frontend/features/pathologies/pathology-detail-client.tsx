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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { documentsApi, pathologiesApi, photosApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import { formatDateTime } from "@/lib/format";
import { segmentIdFromParams } from "@/lib/route-params";
import type { ApiDocument, ApiPathologyDetail, ApiPhoto } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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

const SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/** Aligné sur `FileKind` Prisma — libellés FR pour les sélecteurs. */
const FILE_KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "REPORT", label: "Rapport" },
  { value: "SCAN", label: "Numérisation" },
  { value: "DRAWING", label: "Dessin" },
  { value: "PHOTO", label: "Photo" },
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
];

const FILE_KIND_LABEL: Record<string, string> = Object.fromEntries(
  FILE_KIND_OPTIONS.map((o) => [o.value, o.label]),
);

const PHOTO_TYPES = [
  { value: "VUE_ENSEMBLE", label: "Vue d’ensemble" },
  { value: "DETAIL_PATHOLOGIE", label: "Détail pathologie" },
  { value: "DETAIL_INTERVENTION", label: "Détail intervention" },
  { value: "COMPARATIF_AVANT_APRES", label: "Comparatif avant/après" },
  { value: "AUTRE", label: "Autre" },
];

const PHOTO_PHASES = [
  { value: "AVANT", label: "Avant" },
  { value: "PENDANT", label: "Pendant" },
  { value: "APRES", label: "Après" },
];

function isPdfDoc(mime: string | undefined, url: string | undefined): boolean {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return true;
  const u = (url ?? "").toLowerCase();
  return u.includes(".pdf") || u.includes("/pdf");
}

function isImageDoc(mime: string | undefined): boolean {
  return (mime ?? "").toLowerCase().startsWith("image/");
}

export function PathologyDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = segmentIdFromParams(params);
  const hasId = id.length > 0;
  const qc = useQueryClient();

  const pQ = useQuery({
    queryKey: ["pathology", id],
    queryFn: () => pathologiesApi.get(id),
    enabled: hasId,
  });

  const [tab, setTab] = useState("photos");
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [uploadPhotoType, setUploadPhotoType] = useState("__none__");
  const [uploadPhotoPhase, setUploadPhotoPhase] = useState<string>("__none__");
  const [docKind, setDocKind] = useState("REPORT");
  const [uploadPhotoFiles, setUploadPhotoFiles] = useState<File[]>([]);
  const [uploadPhotoError, setUploadPhotoError] = useState<string | null>(null);
  const [uploadDocFiles, setUploadDocFiles] = useState<File[]>([]);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [docViewer, setDocViewer] = useState<{
    url: string;
    title: string;
    mime?: string;
  } | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editPathOpen, setEditPathOpen] = useState(false);
  const [editPathName, setEditPathName] = useState("");
  const [editPathNameError, setEditPathNameError] = useState<string | null>(null);
  const [editPathType, setEditPathType] = useState<string>("OTHER");
  const [editPathSeverity, setEditPathSeverity] = useState<string>("");
  const [editPathDescription, setEditPathDescription] = useState("");
  const [editPhoto, setEditPhoto] = useState<ApiPhoto | null>(null);
  const [editPhotoTitle, setEditPhotoTitle] = useState("");
  const [editPhotoCaption, setEditPhotoCaption] = useState("");
  const [editPhotoType, setEditPhotoType] = useState("");
  const [editPhotoPhase, setEditPhotoPhase] = useState<string>("");
  const [editDoc, setEditDoc] = useState<ApiDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editDocKind, setEditDocKind] = useState("REPORT");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pathology", id] });

  const uploadPhotoMut = useMutation({
    mutationFn: (files: File[]) =>
      photosApi.uploadPathology(files, id, {
        photoType: uploadPhotoType,
        ...(uploadPhotoPhase !== "__none__" ? { photoPhase: uploadPhotoPhase } : {}),
      }),
    onSuccess: async () => {
      toastSuccess("Photo(s) envoyée(s) avec succès.");
      await invalidate();
      setUploadPhotoOpen(false);
      setUploadPhotoType("__none__");
      setUploadPhotoPhase("__none__");
      setUploadPhotoFiles([]);
      setUploadPhotoError(null);
    },
    onError: () => {
      toastUploadError();
    },
  });

  const uploadDocMut = useMutation({
    mutationFn: (files: File[]) => documentsApi.uploadPathology(files, id, docKind),
    onSuccess: async () => {
      toastSuccess("Document(s) envoyé(s) avec succès.");
      await invalidate();
      setUploadDocOpen(false);
      setUploadDocFiles([]);
      setUploadDocError(null);
    },
    onError: () => {
      toastUploadError();
    },
  });

  const updatePathMut = useMutation({
    mutationFn: () =>
      pathologiesApi.update(id, {
        name: editPathName.trim(),
        pathologyType: editPathType,
        ...(editPathSeverity ? { severity: editPathSeverity } : { severity: null }),
        description: editPathDescription.trim() || null,
      }),
    onSuccess: async () => {
      toastSuccess("Pathologie enregistrée avec succès.");
      await invalidate();
      setEditPathOpen(false);
    },
    onError: (e) => toastMutationError(e),
  });

  const updatePhotoMut = useMutation({
    mutationFn: () =>
      photosApi.update(editPhoto!.id, {
        title: editPhotoTitle.trim() || null,
        caption: editPhotoCaption.trim() || null,
        photoType: editPhotoType.trim() || null,
        ...(editPhotoPhase ? { photoPhase: editPhotoPhase } : { photoPhase: null }),
      }),
    onSuccess: async () => {
      toastSuccess("Photo enregistrée avec succès.");
      await invalidate();
      setEditPhoto(null);
    },
    onError: (e) => toastMutationError(e),
  });

  const updateDocMut = useMutation({
    mutationFn: () =>
      documentsApi.update(editDoc!.id, {
        title: editDocTitle.trim() || null,
        fileKind: editDocKind,
      }),
    onSuccess: async () => {
      toastSuccess("Document enregistré avec succès.");
      await invalidate();
      setEditDoc(null);
    },
    onError: (e) => toastMutationError(e),
  });

  const delPhotoMut = useMutation({
    mutationFn: (pid: string) => photosApi.remove(pid),
    onSuccess: async () => {
      toastSuccess("Photo supprimée avec succès.");
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const delDocMut = useMutation({
    mutationFn: (did: string) => documentsApi.remove(did),
    onSuccess: async () => {
      toastSuccess("Document supprimé avec succès.");
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const delPathMut = useMutation({
    mutationFn: async () => {
      const snap = qc.getQueryData<ApiPathologyDetail>(["pathology", id]);
      await pathologiesApi.remove(id);
      return snap;
    },
    onSuccess: async (snap) => {
      setConfirmDel(false);
      if (snap?.observationId) router.push(`/observations/${snap.observationId}`);
      else if (snap?.zoneId) router.push(`/zones/${snap.zoneId}`);
      else router.push("/pathologies");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const openEditPath = (p: ApiPathologyDetail) => {
    setEditPathName(p.name ?? "");
    setEditPathNameError(null);
    setEditPathType(p.pathologyType);
    setEditPathSeverity(p.severity ?? "");
    setEditPathDescription(p.description ?? "");
    setEditPathOpen(true);
  };

  const openEditPhoto = (ph: ApiPhoto) => {
    setEditPhoto(ph);
    setEditPhotoTitle(ph.title ?? "");
    setEditPhotoCaption(ph.caption ?? "");
    setEditPhotoType(ph.photoType ?? "DETAIL");
    setEditPhotoPhase(ph.photoPhase ?? "");
  };

  const openEditDoc = (d: ApiDocument) => {
    setEditDoc(d);
    setEditDocTitle(d.title ?? "");
    setEditDocKind(d.fileKind ?? "OTHER");
  };

  if (!hasId) {
    return (
      <p className="text-sm text-muted-foreground">
        Identifiant manquant dans l’URL.{" "}
        <Button variant="link" className="px-0" onClick={() => router.back()}>
          Retour
        </Button>
      </p>
    );
  }

  if (pQ.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (pQ.isError) {
    const status = pQ.error instanceof ApiError ? pQ.error.status : 0;
    const is404 = status === 404;
    return (
      <div className="space-y-3 text-sm">
        <p className={is404 ? "text-muted-foreground" : "text-destructive"}>
          {is404 ? "Pathologie introuvable." : "Impossible de charger la pathologie."}
        </p>
        {!is404 && pQ.error instanceof ApiError ? (
          <p className="text-xs text-muted-foreground">{TOAST_MSG.loadFailed}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => pQ.refetch()}>
            Réessayer
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const p = pQ.data;
  if (!p) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  const project = p.zone?.project;
  const zone = p.zone;
  const obs = p.observation;
  const el = p.element;
  const photos = p.photos ?? [];
  const docs = p.documents ?? [];
  const pathologyTitle = p.name?.trim() ? p.name : PATH_LABEL[p.pathologyType] ?? p.pathologyType;

  const breadcrumbItems = [
    { label: "Projets", href: "/projects" },
    ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
    { label: "Zones", href: project ? `/projects/${project.id}` : "/zones" },
    ...(zone ? [{ label: zone.name, href: `/zones/${zone.id}?tab=elements` }] : []),
    ...(el
      ? [
          { label: "Éléments", href: zone ? `/zones/${zone.id}?tab=elements` : "/zones" },
          { label: el.name, href: `/elements/${el.id}` },
        ]
      : []),
    {
      label: "Observations",
      href: el ? `/elements/${el.id}` : zone ? `/zones/${zone.id}?tab=elements` : "/observations",
    },
    ...(obs ? [{ label: obs.title, href: `/observations/${obs.id}` }] : []),
    {
      label: "Pathologies",
      href: obs ? `/observations/${obs.id}` : "/pathologies",
    },
    { label: pathologyTitle },
  ];

  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs items={breadcrumbItems} />
      </StickyPageToolbar>

      <DetailHeader
        code={<span className="font-mono">{p.code}</span>}
        title={pathologyTitle}
        description={p.description ?? undefined}
        badges={
          <>
            <span className="inline-flex rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
              {PATH_LABEL[p.pathologyType] ?? p.pathologyType}
            </span>
            {p.severity ? (
              <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                {SEV_LABEL[p.severity] ?? p.severity}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => openEditPath(p)}
            >
              <Pencil className="h-4 w-4" />
              Modifier la pathologie
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDel(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Supprimer la pathologie
            </Button>
          </>
        }
      />

      <DetailSummaryCard title="Fiche et contexte">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <p className="text-foreground">{p.description?.trim() ? p.description : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Projet : </span>
            {project ? (
              <Link
                href={`/projects/${project.id}`}
                className="font-medium text-primary hover:underline"
              >
                {project.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Zone : </span>
            {zone ? (
              <Link
                href={`/zones/${zone.id}?tab=elements`}
                className="font-medium text-primary hover:underline"
              >
                {zone.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Élément : </span>
            {el ? (
              <Link href={`/elements/${el.id}`} className="font-medium text-primary hover:underline">
                {el.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Observation : </span>
            {obs ? (
              <Link
                href={`/observations/${obs.id}`}
                className="font-medium text-primary hover:underline"
              >
                {obs.title}
              </Link>
            ) : (
              "—"
            )}
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
        </TabsList>

        <TabsContent value="photos" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button
                type="button"
                disabled={uploadPhotoMut.isPending}
                className="w-fit gap-1.5"
                onClick={() => setUploadPhotoOpen(true)}
              >
                {uploadPhotoMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Ajouter des photos
              </Button>
            }
          />
          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune photo pour cette pathologie.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((ph) => (
                <div key={ph.id} className="overflow-hidden rounded-lg border bg-card">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => {
                      setViewerTitle(ph.title ?? ph.originalFilename ?? "Photo");
                      setViewerUrl(ph.secureUrl ?? ph.url ?? null);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ph.secureUrl ?? ph.url ?? ""}
                      alt=""
                      className="h-40 w-full object-cover"
                    />
                  </button>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">
                      {ph.title ?? ph.originalFilename ?? "Sans titre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ph.createdAt ? formatDateTime(ph.createdAt) : "—"}
                    </p>
                    <div className="flex justify-end gap-1 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPhoto(ph);
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          delPhotoMut.mutate(ph.id);
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
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
                disabled={uploadDocMut.isPending}
                variant="secondary"
                className="w-fit gap-1.5"
                onClick={() => setUploadDocOpen(true)}
              >
                {uploadDocMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Ajouter un document
              </Button>
            }
          />
          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun document pour cette pathologie.
            </div>
          ) : (
            <ul className="space-y-3">
              {docs.map((d) => {
                const href = d.secureUrl ?? d.url ?? "#";
                const kindLabel =
                  (d.fileKind && FILE_KIND_LABEL[d.fileKind]) ?? d.fileKind ?? "—";
                return (
                  <li
                    key={d.id}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-tight">
                        {d.title ?? d.originalFilename ?? "Sans titre"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kindLabel}
                        {d.createdAt ? ` · ${formatDateTime(d.createdAt)}` : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          setDocViewer({
                            url: href,
                            title: d.title ?? d.originalFilename ?? "Document",
                            mime: d.mimeType,
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ouvrir
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1" asChild>
                        <a href={href} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Nouvel onglet
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDoc(d)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => delDocMut.mutate(d.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
            <DialogTitle>Ajouter des photos</DialogTitle>
            <p className="text-left text-sm text-muted-foreground">
              Les fichiers sont enregistrés pour cette pathologie. Le titre est déduit du nom de
              Renseignez la phase et le type avant l’envoi.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[min(55vh,420px)] px-6">
            <div className="space-y-4 pb-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type de photo *</Label>
                  <Select
                    value={uploadPhotoType}
                    onValueChange={(v) => {
                      setUploadPhotoType(v);
                      if (v !== "__none__") setUploadPhotoError(null);
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
                  <Label>Phase chantier *</Label>
                  <Select
                    value={uploadPhotoPhase}
                    onValueChange={(v) => {
                      setUploadPhotoPhase(v);
                      if (v !== "__none__") setUploadPhotoError(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sélectionner une phase</SelectItem>
                      {PHOTO_PHASES.map((ph) => (
                        <SelectItem key={ph.value} value={ph.value}>
                          {ph.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pathology-photo-files">Photos *</Label>
                <Input
                  id="pathology-photo-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setUploadPhotoFiles(files);
                    if (files.length) setUploadPhotoError(null);
                  }}
                />
                {uploadPhotoFiles.length ? (
                  <p className="text-xs text-muted-foreground">
                    {uploadPhotoFiles.length} fichier{uploadPhotoFiles.length > 1 ? "s" : ""} sélectionné
                    {uploadPhotoFiles.length > 1 ? "s" : ""}.
                  </p>
                ) : null}
                {uploadPhotoError ? <p className="text-sm text-destructive">{uploadPhotoError}</p> : null}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setUploadPhotoOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={uploadPhotoMut.isPending}
              onClick={() => {
                if (uploadPhotoType === "__none__") {
                  setUploadPhotoError("Le type de photo est obligatoire.");
                  return;
                }
                if (uploadPhotoPhase === "__none__") {
                  setUploadPhotoError("La phase chantier est obligatoire.");
                  return;
                }
                if (!uploadPhotoFiles.length) {
                  setUploadPhotoError("Sélectionnez au moins une photo.");
                  return;
                }
                setUploadPhotoError(null);
                uploadPhotoMut.mutate(uploadPhotoFiles);
              }}
            >
              {uploadPhotoMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
            <DialogTitle>Ajouter un document</DialogTitle>
            <p className="text-left text-sm text-muted-foreground">
              Type de document obligatoire. Le titre est généré automatiquement à partir du nom du
              fichier.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[min(45vh,320px)] px-6">
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label>Type de document *</Label>
                <Select value={docKind} onValueChange={setDocKind}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_KIND_OPTIONS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pathology-doc-file">Fichier(s) *</Label>
                <Input
                  id="pathology-doc-file"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setUploadDocFiles(files);
                    if (files.length) setUploadDocError(null);
                  }}
                />
                {uploadDocFiles.length ? (
                  <p className="text-xs text-muted-foreground">
                    {uploadDocFiles.length} document{uploadDocFiles.length > 1 ? "s" : ""} sélectionné
                    {uploadDocFiles.length > 1 ? "s" : ""}.
                  </p>
                ) : null}
                {uploadDocError ? <p className="text-sm text-destructive">{uploadDocError}</p> : null}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setUploadDocOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={uploadDocMut.isPending}
              onClick={() => {
                if (!uploadDocFiles.length) {
                  setUploadDocError("Sélectionnez au moins un document.");
                  return;
                }
                setUploadDocError(null);
                uploadDocMut.mutate(uploadDocFiles);
              }}
            >
              {uploadDocMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityFormModal
        open={editPathOpen}
        onOpenChange={setEditPathOpen}
        title="Modifier la pathologie"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditPathOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={updatePathMut.isPending}
              onClick={() => {
                if (!editPathName.trim()) {
                  setEditPathNameError("Le nom pathologie est obligatoire.");
                  return;
                }
                if (!editPathSeverity) return;
                setEditPathNameError(null);
                updatePathMut.mutate();
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nom pathologie *</Label>
              <Input
                value={editPathName}
                onChange={(e) => {
                  setEditPathName(e.target.value);
                  if (editPathNameError) setEditPathNameError(null);
                }}
                maxLength={255}
                aria-invalid={Boolean(editPathNameError)}
              />
              {editPathNameError ? (
                <p className="text-sm text-destructive">{editPathNameError}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Type de pathologie</Label>
              <Select value={editPathType} onValueChange={setEditPathType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATH_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PATH_LABEL[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravité *</Label>
              <Select
                value={editPathSeverity || "__none__"}
                onValueChange={(v) => setEditPathSeverity(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {SEVERITY_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEV_LABEL[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editPathDescription}
                onChange={(e) => setEditPathDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
      </EntityFormModal>

      <Dialog open={Boolean(editPhoto)} onOpenChange={(o) => !o && setEditPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la photo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={editPhotoTitle} onChange={(e) => setEditPhotoTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Légende</Label>
              <Textarea
                value={editPhotoCaption}
                onChange={(e) => setEditPhotoCaption(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editPhotoType || "DETAIL"} onValueChange={setEditPhotoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select
                value={editPhotoPhase || "__none__"}
                onValueChange={(v) => setEditPhotoPhase(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {PHOTO_PHASES.map((ph) => (
                    <SelectItem key={ph.value} value={ph.value}>
                      {ph.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditPhoto(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={updatePhotoMut.isPending}
              onClick={() => updatePhotoMut.mutate()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editDoc)} onOpenChange={(o) => !o && setEditDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={editDocTitle} onChange={(e) => setEditDocTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editDocKind} onValueChange={setEditDocKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_KIND_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDoc(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={updateDocMut.isPending}
              onClick={() => updateDocMut.mutate()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette pathologie ?</DialogTitle>
            <DialogDescription className="text-left">
              Les documents et médias rattachés à cette pathologie seront supprimés. Les décisions qui référencent
              cette pathologie seront conservées : le lien pathologie sera retiré (pas de suppression des décisions).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={delPathMut.isPending} onClick={() => delPathMut.mutate()}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewerUrl)} onOpenChange={(x) => !x && setViewerUrl(null)}>
        <DialogContent variant="viewer">
          <DialogHeader className="shrink-0 px-4 pt-4">
            <DialogTitle className="truncate pr-10">{viewerTitle}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
            {viewerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewerUrl} alt="" className="h-full w-full object-contain" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(docViewer)} onOpenChange={(x) => !x && setDocViewer(null)}>
        <DialogContent variant="viewer">
          <DialogHeader className="shrink-0 px-4 pt-4">
            <DialogTitle className="truncate pr-10">{docViewer?.title}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
            {docViewer && isPdfDoc(docViewer.mime, docViewer.url) ? (
              <iframe
                title={docViewer.title}
                src={docViewer.url}
                className="h-full min-h-[70vh] w-full rounded-md border bg-muted/30"
              />
            ) : docViewer && isImageDoc(docViewer.mime) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={docViewer.url}
                alt=""
                className="mx-auto max-h-full max-w-full object-contain"
              />
            ) : docViewer ? (
              <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
                <p>Aperçu non disponible pour ce type de fichier.</p>
                <Button variant="outline" asChild>
                  <a href={docViewer.url} target="_blank" rel="noreferrer">
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
