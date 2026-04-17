"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StickyPageToolbar } from "@/components/shared/sticky-page-toolbar";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSummaryCard } from "@/components/shared/detail-summary-card";
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
import { toastMutationError, toastSuccess, toastUploadError, TOAST_MSG } from "@/lib/toast-feedback";
import {
  actorsApi,
  documentsApi,
  fetchAllPages,
  interventionsApi,
  photosApi,
  risksApi,
} from "@/lib/api/resources";
import { formatDate, formatDateTime } from "@/lib/format";
import { segmentIdFromParams } from "@/lib/route-params";
import type { ApiDocument, ApiInterventionDetail, ApiPhoto, ApiRisk } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
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

const INT_TYPES = [
  "CLEANING",
  "CONSOLIDATION",
  "REPAIR",
  "REPLACEMENT_PARTIAL",
  "PROTECTION",
  "RE_INTEGRATION",
  "PROVISIONAL",
  "SURVEY",
  "OTHER",
] as const;
const INT_TYPE_LABEL: Record<string, string> = {
  CLEANING: "Nettoyage",
  CONSOLIDATION: "Consolidation",
  REPAIR: "Réparation",
  REPLACEMENT_PARTIAL: "Remplacement partiel",
  PROTECTION: "Protection",
  RE_INTEGRATION: "Réintégration",
  PROVISIONAL: "Provisoire",
  SURVEY: "Diagnostic / relevé",
  OTHER: "Autre",
};
const INT_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "CANCELLED"] as const;
const INT_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planifiée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  VERIFIED: "Vérifiée",
  CANCELLED: "Annulée",
};

const RISK_CATEGORIES = [
  "STRUCTURAL",
  "HERITAGE_VALUE",
  "HEALTH_SAFETY",
  "ENVIRONMENTAL",
  "SCHEDULE",
  "COST",
  "REPUTATIONAL",
  "OTHER",
] as const;
const RISK_CAT_LABEL: Record<string, string> = {
  STRUCTURAL: "Structure / stabilité",
  HERITAGE_VALUE: "Valeur patrimoniale",
  HEALTH_SAFETY: "Santé / sécurité",
  ENVIRONMENTAL: "Environnement",
  SCHEDULE: "Planning",
  COST: "Coût",
  REPUTATIONAL: "Réputation",
  OTHER: "Autre",
};
const RISK_PROB = ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"] as const;
const RISK_PROB_LABEL: Record<string, string> = {
  RARE: "Rare",
  UNLIKELY: "Peu probable",
  POSSIBLE: "Possible",
  LIKELY: "Probable",
  ALMOST_CERTAIN: "Quasi certain",
};
const RISK_IMPACT = ["NEGLIGIBLE", "MINOR", "MODERATE", "MAJOR", "CATASTROPHIC"] as const;
const RISK_IMPACT_LABEL: Record<string, string> = {
  NEGLIGIBLE: "Négligeable",
  MINOR: "Mineur",
  MODERATE: "Modéré",
  MAJOR: "Majeur",
  CATASTROPHIC: "Catastrophique",
};
const RISK_STATUS = ["OPEN", "MITIGATING", "CLOSED", "ACCEPTED"] as const;
const RISK_STATUS_LABEL: Record<string, string> = {
  OPEN: "Ouvert",
  MITIGATING: "En atténuation",
  CLOSED: "Clôturé",
  ACCEPTED: "Accepté",
};

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

function dateInputFromIso(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function InterventionDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = segmentIdFromParams(params);
  const hasId = id.length > 0;
  const qc = useQueryClient();

  const iQ = useQuery({
    queryKey: ["intervention", id],
    queryFn: () => interventionsApi.get(id),
    enabled: hasId,
  });

  const [tab, setTab] = useState("photos");
  const [confirmDel, setConfirmDel] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [iType, setIType] = useState("CONSOLIDATION");
  const [iStatus, setIStatus] = useState("PLANNED");
  const [iDesc, setIDesc] = useState("");
  const [iCompanyActorId, setICompanyActorId] = useState("__none__");
  const [iStart, setIStart] = useState("");
  const [iEnd, setIEnd] = useState("");
  const [iPathId, setIPathId] = useState("__none__");

  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [uploadPhotoType, setUploadPhotoType] = useState("__none__");
  const [uploadPhotoPhase, setUploadPhotoPhase] = useState("__none__");
  const [uploadPhotoFiles, setUploadPhotoFiles] = useState<File[]>([]);
  const [uploadPhotoError, setUploadPhotoError] = useState<string | null>(null);

  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [docKind, setDocKind] = useState("REPORT");
  const [uploadDocFiles, setUploadDocFiles] = useState<File[]>([]);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [docViewer, setDocViewer] = useState<{
    url: string;
    title: string;
    mime?: string;
  } | null>(null);
  const [editPhoto, setEditPhoto] = useState<ApiPhoto | null>(null);
  const [editPhotoTitle, setEditPhotoTitle] = useState("");
  const [editPhotoCaption, setEditPhotoCaption] = useState("");
  const [editPhotoType, setEditPhotoType] = useState("");
  const [editPhotoPhase, setEditPhotoPhase] = useState("");
  const [editDoc, setEditDoc] = useState<ApiDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editDocKind, setEditDocKind] = useState("REPORT");

  const [riskOpen, setRiskOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<ApiRisk | null>(null);
  const [rTitle, setRTitle] = useState("");
  const [rCat, setRCat] = useState("OTHER");
  const [rProb, setRProb] = useState("__none__");
  const [rImpact, setRImpact] = useState("__none__");
  const [rStatus, setRStatus] = useState("OPEN");
  const [rMit, setRMit] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [delRisk, setDelRisk] = useState<ApiRisk | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["intervention", id] });
  const actorsQ = useQuery({
    queryKey: ["actors", "pick"],
    queryFn: () => fetchAllPages((page) => actorsApi.list({ page, limit: 100 })),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      const inv = iQ.data;
      if (!inv) throw new Error("missing");
      const pathologyId = iPathId === "__none__" ? null : iPathId;
      return interventionsApi.update(inv.id, {
        interventionType: iType,
        status: iStatus,
        description: iDesc.trim() || null,
        companyActorId: iCompanyActorId === "__none__" ? null : iCompanyActorId,
        plannedStart: iStart ? `${iStart}T12:00:00.000Z` : null,
        plannedEnd: iEnd ? `${iEnd}T12:00:00.000Z` : null,
        pathologyId,
        elementId: inv.decision?.observation?.elementId ?? null,
      });
    },
    onSuccess: async () => {
      toastSuccess("Intervention enregistrée avec succès.");
      await invalidate();
      setEditOpen(false);
    },
    onError: (e) => toastMutationError(e),
  });

  const delMut = useMutation({
    mutationFn: async () => {
      const snap = qc.getQueryData<ApiInterventionDetail>(["intervention", id]);
      await interventionsApi.remove(id);
      return snap;
    },
    onSuccess: async (snap) => {
      setConfirmDel(false);
      if (snap?.decisionId) router.push(`/decisions/${snap.decisionId}`);
      else router.push("/interventions");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const uploadPhotoMut = useMutation({
    mutationFn: (files: File[]) =>
      photosApi.uploadIntervention(files, id, {
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
    mutationFn: (files: File[]) => documentsApi.uploadIntervention(files, id, docKind),
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

  const saveRiskMut = useMutation({
    mutationFn: async () => {
      const inv = iQ.data;
      if (!inv) throw new Error("missing");
      const projectId = inv.zone?.project?.id;
      if (!projectId) throw new Error("Projet introuvable.");
      const title = rTitle.trim();
      if (!title) throw new Error("Titre requis.");
      const base = {
        title,
        riskCategory: rCat,
        probability: rProb === "__none__" ? null : rProb,
        impact: rImpact === "__none__" ? null : rImpact,
        status: rStatus,
        mitigation: rMit.trim() || null,
        description: rDesc.trim() || null,
        interventionId: inv.id,
        decisionId: inv.decisionId,
        zoneId: inv.zoneId,
        projectId,
      };
      if (editingRisk) return risksApi.update(editingRisk.id, base);
      return risksApi.create(base);
    },
    onSuccess: async () => {
      toastSuccess(editingRisk ? "Risque enregistré avec succès." : "Risque créé avec succès.");
      await invalidate();
      setRiskOpen(false);
      setEditingRisk(null);
    },
    onError: (e) => toastMutationError(e),
  });

  const delRiskMut = useMutation({
    mutationFn: (rid: string) => risksApi.remove(rid),
    onSuccess: async () => {
      toastSuccess("Risque supprimé avec succès.");
      setDelRisk(null);
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const openEdit = (inv: ApiInterventionDetail) => {
    setIType(inv.interventionType);
    setIStatus(inv.status);
    setIDesc(inv.description ?? "");
    setICompanyActorId(inv.companyActorId ?? "__none__");
    setIStart(dateInputFromIso(inv.plannedStart));
    setIEnd(dateInputFromIso(inv.plannedEnd));
    setIPathId(inv.pathologyId ?? "__none__");
    setEditOpen(true);
  };

  const pathologyOptionsForIntervention = (inv: ApiInterventionDetail) => {
    const opts: { id: string; label: string }[] = [];
    const decP = inv.decision?.pathology;
    if (decP?.id) {
      opts.push({
        id: decP.id,
        label: `${decP.code} — ${PATH_LABEL[decP.pathologyType ?? ""] ?? decP.pathologyType ?? ""}`,
      });
    }
    const ownP = inv.pathology;
    if (ownP?.id && !opts.some((o) => o.id === ownP.id)) {
      opts.push({
        id: ownP.id,
        label: `${ownP.code} — ${PATH_LABEL[ownP.pathologyType ?? ""] ?? ownP.pathologyType ?? ""}`,
      });
    }
    return opts;
  };

  if (!hasId) {
    return (
      <p className="text-sm text-muted-foreground">
        Identifiant manquant.{" "}
        <Button variant="link" className="px-0" onClick={() => router.back()}>
          Retour
        </Button>
      </p>
    );
  }

  if (iQ.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (iQ.isError) {
    const status = iQ.error instanceof ApiError ? iQ.error.status : 0;
    const is404 = status === 404;
    return (
      <div className="space-y-3 text-sm">
        <p className={is404 ? "text-muted-foreground" : "text-destructive"}>
          {is404 ? "Intervention introuvable." : "Impossible de charger l’intervention."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => iQ.refetch()}>
            Réessayer
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const inv = iQ.data;
  if (!inv) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const project = inv.zone?.project;
  const zone = inv.zone;
  const dec = inv.decision;
  const obs = dec?.observation;
  const el = obs?.element;
  const photos = inv.photos ?? [];
  const docs = inv.documents ?? [];
  const risks = inv.risks ?? [];
  const pathOpts = pathologyOptionsForIntervention(inv);

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
    ...(dec
      ? [
          { label: "Décisions", href: obs ? `/observations/${obs.id}` : "/decisions" },
          { label: dec.title, href: `/decisions/${dec.id}` },
          { label: "Interventions", href: `/decisions/${dec.id}` },
        ]
      : []),
    { label: inv.code },
  ];

  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs items={breadcrumbItems} />
      </StickyPageToolbar>

      <DetailHeader
        code={<span className="font-mono">{inv.code}</span>}
        title={INT_TYPE_LABEL[inv.interventionType] ?? inv.interventionType}
        description={inv.description ?? undefined}
        badges={
          <>
            <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
              {INT_STATUS_LABEL[inv.status] ?? inv.status}
            </span>
            {inv.plannedStart ? (
              <span className="inline-flex rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                Début {formatDate(inv.plannedStart)}
              </span>
            ) : null}
            {inv.plannedEnd ? (
              <span className="inline-flex rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                Fin {formatDate(inv.plannedEnd)}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(inv)}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDel(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Supprimer
            </Button>
          </>
        }
      />

      <DetailSummaryCard title="Informations et liens">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Entreprise : </span>
            {inv.companyActor?.name ?? inv.companyName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Décision : </span>
            {dec ? (
              <Link href={`/decisions/${dec.id}`} className="font-medium text-primary hover:underline">
                {dec.title}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Pathologie : </span>
            {inv.pathology ? (
              <Link href={`/pathologies/${inv.pathology.id}`} className="font-medium text-primary hover:underline">
                {PATH_LABEL[inv.pathology.pathologyType ?? ""] ??
                  inv.pathology.pathologyType ??
                  inv.pathology.code}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Zone : </span>
            {zone ? (
              <Link href={`/zones/${zone.id}?tab=elements`} className="font-medium text-primary hover:underline">
                {zone.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Projet : </span>
            {project ? (
              <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                {project.name}
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
          <TabsTrigger value="risks" className="gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Risques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" className="w-fit gap-1.5" onClick={() => setUploadPhotoOpen(true)}>
                <Plus className="h-4 w-4" />
                Ajouter des photos
              </Button>
            }
          />
          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune photo pour cette intervention.
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
                        onClick={() => {
                          setEditPhoto(ph);
                          setEditPhotoTitle(ph.title ?? "");
                          setEditPhotoCaption(ph.caption ?? "");
                          setEditPhotoType(ph.photoType ?? "DETAIL");
                          setEditPhotoPhase(ph.photoPhase ?? "");
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
                        onClick={() => delPhotoMut.mutate(ph.id)}
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
              <Button type="button" variant="secondary" className="w-fit gap-1.5" onClick={() => setUploadDocOpen(true)}>
                <Plus className="h-4 w-4" />
                Ajouter des documents
              </Button>
            }
          />
          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun document pour cette intervention.
            </div>
          ) : (
            <ul className="space-y-3">
              {docs.map((doc) => {
                const href = doc.secureUrl ?? doc.url ?? "#";
                const kindLabel =
                  (doc.fileKind && FILE_KIND_LABEL[doc.fileKind]) ?? doc.fileKind ?? "—";
                return (
                  <li
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-tight">
                        {doc.title ?? doc.originalFilename ?? "Sans titre"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kindLabel}
                        {doc.createdAt ? ` · ${formatDateTime(doc.createdAt)}` : null}
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
                            title: doc.title ?? doc.originalFilename ?? "Document",
                            mime: doc.mimeType,
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
                        onClick={() => {
                          setEditDoc(doc);
                          setEditDocTitle(doc.title ?? "");
                          setEditDocKind(doc.fileKind ?? "OTHER");
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => delDocMut.mutate(doc.id)}
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

        <TabsContent value="risks" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button
                type="button"
                className="w-fit gap-1.5"
                onClick={() => {
                  setEditingRisk(null);
                  setRTitle("");
                  setRCat("OTHER");
                  setRProb("__none__");
                  setRImpact("__none__");
                  setRStatus("OPEN");
                  setRMit("");
                  setRDesc("");
                  setRiskOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un risque
              </Button>
            }
          />
          {risks.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun risque lié à cette intervention.
            </div>
          ) : (
            <ul className="space-y-2 rounded-xl border bg-card p-4 text-sm">
              {risks.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 border-b border-border/60 py-3 last:border-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{r.title}</span>
                    <span className="ml-2 text-muted-foreground">
                      {RISK_CAT_LABEL[r.riskCategory] ?? r.riskCategory}
                    </span>
                    {r.probability ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        P : {RISK_PROB_LABEL[r.probability] ?? r.probability}
                      </span>
                    ) : null}
                    {r.impact ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        I : {RISK_IMPACT_LABEL[r.impact] ?? r.impact}
                      </span>
                    ) : null}
                    <span className="ml-2 text-xs">
                      {RISK_STATUS_LABEL[r.status ?? "OPEN"] ?? r.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRisk(r);
                        setRTitle(r.title);
                        setRCat(r.riskCategory);
                        setRProb(r.probability ?? "__none__");
                        setRImpact(r.impact ?? "__none__");
                        setRStatus(r.status ?? "OPEN");
                        setRMit(r.mitigation ?? "");
                        setRDesc(r.description ?? "");
                        setRiskOpen(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDelRisk(r)}>
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
            <DialogTitle>Ajouter des photos</DialogTitle>
            <p className="text-left text-sm text-muted-foreground">
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
                <Label htmlFor="intervention-photo-files">Photos *</Label>
                <Input
                  id="intervention-photo-files"
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
            <Button variant="outline" onClick={() => setUploadPhotoOpen(false)}>
              Annuler
            </Button>
            <Button
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
            <DialogTitle>Ajouter des documents</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[40vh] px-6">
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label>Type *</Label>
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
                <Label htmlFor="intervention-doc-file">Fichier(s) *</Label>
                <Input
                  id="intervention-doc-file"
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
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setUploadDocOpen(false)}>
              Annuler
            </Button>
            <Button
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>Modifier l’intervention</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[min(70vh,560px)] px-6">
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={iType} onValueChange={setIType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {INT_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={iStatus} onValueChange={setIStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INT_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {INT_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={iDesc} onChange={(e) => setIDesc(e.target.value)} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Entreprise</Label>
                  <Select value={iCompanyActorId} onValueChange={setICompanyActorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une entreprise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Non renseigné</SelectItem>
                      {(actorsQ.data ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Début prévu</Label>
                  <Input type="date" value={iStart} onChange={(e) => setIStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fin prévue</Label>
                  <Input type="date" value={iEnd} onChange={(e) => setIEnd(e.target.value)} />
                </div>
              </div>
              {pathOpts.length > 0 ? (
                <div className="space-y-2">
                  <Label>Pathologie liée (optionnel)</Label>
                  <Select value={iPathId} onValueChange={setIPathId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {pathOpts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button disabled={updateMut.isPending} onClick={() => updateMut.mutate()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>{editingRisk ? "Modifier le risque" : "Nouveau risque"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[min(60vh,440px)] px-6">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input value={rTitle} onChange={(e) => setRTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={rCat} onValueChange={setRCat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {RISK_CAT_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Probabilité</Label>
                  <Select value={rProb} onValueChange={setRProb}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {RISK_PROB.map((p) => (
                        <SelectItem key={p} value={p}>
                          {RISK_PROB_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impact</Label>
                  <Select value={rImpact} onValueChange={setRImpact}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {RISK_IMPACT.map((x) => (
                        <SelectItem key={x} value={x}>
                          {RISK_IMPACT_LABEL[x]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={rStatus} onValueChange={setRStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {RISK_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Atténuation</Label>
                <Textarea value={rMit} onChange={(e) => setRMit(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={rDesc} onChange={(e) => setRDesc(e.target.value)} rows={2} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setRiskOpen(false)}>
              Annuler
            </Button>
            <Button disabled={saveRiskMut.isPending} onClick={() => saveRiskMut.mutate()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Textarea value={editPhotoCaption} onChange={(e) => setEditPhotoCaption(e.target.value)} rows={3} />
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
            <Button variant="outline" onClick={() => setEditPhoto(null)}>
              Annuler
            </Button>
            <Button disabled={updatePhotoMut.isPending} onClick={() => updatePhotoMut.mutate()}>
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
            <Button variant="outline" onClick={() => setEditDoc(null)}>
              Annuler
            </Button>
            <Button disabled={updateDocMut.isPending} onClick={() => updateDocMut.mutate()}>
              Enregistrer
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
                <p>Aperçu non disponible.</p>
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

      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette intervention ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : les documents, médias et risques rattachés à cette intervention seront supprimés
              en cascade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={delMut.isPending} onClick={() => delMut.mutate()}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(delRisk)} onOpenChange={(o) => !o && setDelRisk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce risque ?</DialogTitle>
            <DialogDescription className="text-left">
              Ce risque sera retiré du registre. Aucune autre entité métier n’est supprimée avec lui.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelRisk(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={delRiskMut.isPending}
              onClick={() => delRisk && delRiskMut.mutate(delRisk.id)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
