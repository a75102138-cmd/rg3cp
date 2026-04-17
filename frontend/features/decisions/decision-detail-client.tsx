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
import { MultiSelectPopover } from "@/components/shared/multi-select-popover";
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
  decisionsApi,
  documentsApi,
  fetchAllPages,
  interventionsApi,
  risksApi,
} from "@/lib/api/resources";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  DOCTRINAL_PRINCIPLES_OPTIONS,
  parseDoctrinalPrinciples,
} from "@/lib/labels/doctrinal-principles-fr";
import { segmentIdFromParams } from "@/lib/route-params";
import type {
  ApiDecisionDetail,
  ApiDocument,
  ApiIntervention,
  ApiRisk,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  FileText,
  Hammer,
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

const DEC_TYPE_LABEL: Record<string, string> = {
  CONSERVATION_APPROACH: "Approche de conservation",
  INTERVENTION_PRINCIPLE: "Principe d’intervention",
  MATERIAL_CHOICE: "Choix des matériaux",
  METHODOLOGY: "Méthodologie",
  VALIDATION_PV: "Validation / PV",
  REGULATORY: "Réglementaire",
  OTHER: "Autre",
};

const DEC_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PROPOSED: "Proposée",
  APPROVED: "Approuvée",
  SUPERSEDED: "Remplacée",
  CANCELLED: "Annulée",
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

export function DecisionDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = segmentIdFromParams(params);
  const hasId = id.length > 0;
  const qc = useQueryClient();

  const dQ = useQuery({
    queryKey: ["decision", id],
    queryFn: () => decisionsApi.get(id),
    enabled: hasId,
  });

  const [tab, setTab] = useState("documents");
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [docKind, setDocKind] = useState("REPORT");
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editDecOpen, setEditDecOpen] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eType, setEType] = useState("CONSERVATION_APPROACH");
  const [eStatus, setEStatus] = useState("DRAFT");
  const [eDate, setEDate] = useState("");
  const [ePrinciples, setEPrinciples] = useState<Set<string>>(new Set());
  const [eJust, setEJust] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [editDoc, setEditDoc] = useState<ApiDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editDocKind, setEditDocKind] = useState("REPORT");
  const [docViewer, setDocViewer] = useState<{
    url: string;
    title: string;
    mime?: string;
  } | null>(null);

  const [intOpen, setIntOpen] = useState(false);
  const [editingInt, setEditingInt] = useState<ApiIntervention | null>(null);
  const [iType, setIType] = useState("CONSOLIDATION");
  const [iStatus, setIStatus] = useState("PLANNED");
  const [iDesc, setIDesc] = useState("");
  const [iCompanyActorId, setICompanyActorId] = useState("__none__");
  const [iStart, setIStart] = useState("");
  const [iEnd, setIEnd] = useState("");
  const [iPathId, setIPathId] = useState("__none__");
  const [delInt, setDelInt] = useState<ApiIntervention | null>(null);

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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["decision", id] });
  const actorsQ = useQuery({
    queryKey: ["actors", "pick"],
    queryFn: () => fetchAllPages((page) => actorsApi.list({ page, limit: 100 })),
  });

  const uploadDocMut = useMutation({
    mutationFn: (file: File) => documentsApi.uploadDecision([file], id, docKind),
    onSuccess: async () => {
      toastSuccess("Document envoyé avec succès.");
      await invalidate();
      setUploadDocOpen(false);
      setUploadDocFile(null);
      setUploadDocError(null);
    },
    onError: () => {
      toastUploadError();
    },
  });

  const updateDecMut = useMutation({
    mutationFn: () =>
      decisionsApi.update(id, {
        title: eTitle.trim(),
        decisionType: eType,
        status: eStatus,
        decidedAt: eDate ? `${eDate}T12:00:00.000Z` : null,
        doctrinalPrinciples: ePrinciples.size > 0 ? Array.from(ePrinciples) : null,
        justification: eJust.trim() || null,
        description: eDesc.trim() || null,
      }),
    onSuccess: async () => {
      toastSuccess("Décision enregistrée avec succès.");
      await invalidate();
      setEditDecOpen(false);
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

  const delDocMut = useMutation({
    mutationFn: (did: string) => documentsApi.remove(did),
    onSuccess: async () => {
      toastSuccess("Document supprimé avec succès.");
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const saveIntMut = useMutation({
    mutationFn: async () => {
      const d = dQ.data;
      if (!d) throw new Error("missing");
      const pathologyId = iPathId === "__none__" ? null : iPathId;
      if (editingInt) {
        return interventionsApi.update(editingInt.id, {
          interventionType: iType,
          status: iStatus,
          description: iDesc.trim() || null,
          companyActorId: iCompanyActorId === "__none__" ? null : iCompanyActorId,
          plannedStart: iStart ? `${iStart}T12:00:00.000Z` : null,
          plannedEnd: iEnd ? `${iEnd}T12:00:00.000Z` : null,
          pathologyId,
          elementId: d.observation?.elementId ?? null,
        });
      }
      return interventionsApi.create({
        decisionId: d.id,
        zoneId: d.zoneId,
        elementId: d.observation?.elementId ?? undefined,
        ...(pathologyId ? { pathologyId } : {}),
        interventionType: iType,
        status: iStatus,
        description: iDesc.trim() || undefined,
        companyActorId: iCompanyActorId === "__none__" ? undefined : iCompanyActorId,
        plannedStart: iStart ? `${iStart}T12:00:00.000Z` : undefined,
        plannedEnd: iEnd ? `${iEnd}T12:00:00.000Z` : undefined,
      });
    },
    onSuccess: async () => {
      toastSuccess(editingInt ? "Intervention enregistrée avec succès." : "Intervention créée avec succès.");
      await invalidate();
      setIntOpen(false);
      setEditingInt(null);
    },
    onError: (e) => toastMutationError(e),
  });

  const delIntMut = useMutation({
    mutationFn: (iid: string) => interventionsApi.remove(iid),
    onSuccess: async () => {
      toastSuccess("Intervention supprimée avec succès.");
      setDelInt(null);
      await invalidate();
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const saveRiskMut = useMutation({
    mutationFn: async () => {
      const d = dQ.data;
      if (!d) throw new Error("missing");
      const projectId = d.zone?.project?.id;
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
        decisionId: d.id,
        zoneId: d.zoneId,
        projectId,
        interventionId: null,
      };
      if (editingRisk) {
        return risksApi.update(editingRisk.id, base);
      }
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

  const delDecMut = useMutation({
    mutationFn: async () => {
      const snap = qc.getQueryData<ApiDecisionDetail>(["decision", id]);
      await decisionsApi.remove(id);
      return snap;
    },
    onSuccess: async (snap) => {
      setConfirmDel(false);
      if (snap?.observationId) router.push(`/observations/${snap.observationId}`);
      else if (snap?.zoneId) router.push(`/zones/${snap.zoneId}`);
      else router.push("/decisions");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const openEditDec = (d: ApiDecisionDetail) => {
    setETitle(d.title);
    setEType(d.decisionType);
    setEStatus(d.status);
    setEDate(dateInputFromIso(d.decidedAt));
    setEPrinciples(new Set(parseDoctrinalPrinciples(d.doctrinalPrinciples)));
    setEJust(d.justification ?? "");
    setEDesc(d.description ?? "");
    setEditDecOpen(true);
  };

  const openCreateInt = () => {
    setEditingInt(null);
    setIType("CONSOLIDATION");
    setIStatus("PLANNED");
    setIDesc("");
    setICompanyActorId("__none__");
    setIStart("");
    setIEnd("");
    setIPathId(dQ.data?.pathologyId ?? "__none__");
    setIntOpen(true);
  };

  const openEditInt = (i: ApiIntervention) => {
    setEditingInt(i);
    setIType(i.interventionType);
    setIStatus(i.status);
    setIDesc(i.description ?? "");
    setICompanyActorId(i.companyActorId ?? "__none__");
    setIStart(dateInputFromIso(i.plannedStart));
    setIEnd(dateInputFromIso(i.plannedEnd));
    setIPathId(i.pathologyId ?? "__none__");
    setIntOpen(true);
  };

  const openCreateRisk = () => {
    setEditingRisk(null);
    setRTitle("");
    setRCat("OTHER");
    setRProb("__none__");
    setRImpact("__none__");
    setRStatus("OPEN");
    setRMit("");
    setRDesc("");
    setRiskOpen(true);
  };

  const openEditRisk = (r: ApiRisk) => {
    setEditingRisk(r);
    setRTitle(r.title);
    setRCat(r.riskCategory);
    setRProb(r.probability ?? "__none__");
    setRImpact(r.impact ?? "__none__");
    setRStatus(r.status ?? "OPEN");
    setRMit(r.mitigation ?? "");
    setRDesc(r.description ?? "");
    setRiskOpen(true);
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

  if (dQ.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (dQ.isError) {
    const status = dQ.error instanceof ApiError ? dQ.error.status : 0;
    const is404 = status === 404;
    return (
      <div className="space-y-3 text-sm">
        <p className={is404 ? "text-muted-foreground" : "text-destructive"}>
          {is404 ? "Décision introuvable." : "Impossible de charger la décision."}
        </p>
        {!is404 && dQ.error instanceof ApiError ? (
          <p className="text-xs text-muted-foreground">{TOAST_MSG.loadFailed}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => dQ.refetch()}>
            Réessayer
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const d = dQ.data;
  if (!d) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const project = d.zone?.project;
  const zone = d.zone;
  const obs = d.observation;
  const el = obs?.element;
  const path = d.pathology;
  const docs = d.documents ?? [];
  const ints = d.interventions ?? [];
  const risks = d.risks ?? [];

  const pathologyOptions =
    d.pathologyId && path
      ? [{ id: d.pathologyId, label: `${path.code} — ${PATH_LABEL[path.pathologyType ?? ""] ?? path.pathologyType ?? ""}` }]
      : [];

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
    { label: "Décisions", href: obs ? `/observations/${obs.id}` : "/decisions" },
    { label: d.title },
  ];

  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs items={breadcrumbItems} />
      </StickyPageToolbar>

      <DetailHeader
        code={<span className="font-mono">{d.code}</span>}
        title={d.title}
        description={d.description ?? undefined}
        badges={
          <>
            <span className="inline-flex rounded-md border bg-muted/40 px-2 py-0.5 text-xs">
              {DEC_TYPE_LABEL[d.decisionType] ?? d.decisionType}
            </span>
            <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
              {DEC_STATUS_LABEL[d.status] ?? d.status}
            </span>
            {d.decidedAt ? (
              <span className="inline-flex rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                {formatDate(d.decidedAt)}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openEditDec(d)}>
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

      <DetailSummaryCard title="Contenu et contexte">
        <div className="space-y-4 text-sm">
          {d.doctrinalPrinciples ? (
            <div>
              <p className="text-muted-foreground">Principe doctrinal</p>
              <p className="mt-1 leading-relaxed">
                {parseDoctrinalPrinciples(d.doctrinalPrinciples).join(" · ")}
              </p>
            </div>
          ) : null}
          {d.justification ? (
            <div>
              <p className="text-muted-foreground">Justification</p>
              <p className="mt-1 leading-relaxed">{d.justification}</p>
            </div>
          ) : null}
          <div className="grid gap-2 border-t pt-4 sm:grid-cols-2">
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
              <span className="text-muted-foreground">Observation : </span>
              {obs ? (
                <Link href={`/observations/${obs.id}`} className="font-medium text-primary hover:underline">
                  {obs.title}
                </Link>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Pathologie : </span>
              {path ? (
                <Link href={`/pathologies/${path.id}`} className="font-medium text-primary hover:underline">
                  {PATH_LABEL[path.pathologyType ?? ""] ?? path.pathologyType ?? path.code}
                </Link>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </DetailSummaryCard>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="interventions" className="gap-1.5">
            <Hammer className="h-4 w-4" />
            Interventions
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Risques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" className="w-fit gap-1.5" onClick={() => setUploadDocOpen(true)}>
                <Plus className="h-4 w-4" />
                Ajouter un document
              </Button>
            }
          />
          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun document pour cette décision.
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

        <TabsContent value="interventions" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" className="w-fit gap-1.5" onClick={openCreateInt}>
                <Plus className="h-4 w-4" />
                Ajouter une intervention
              </Button>
            }
          />
          {ints.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              <p>Aucune intervention pour cette décision.</p>
              <Button type="button" className="mt-4 gap-1.5" onClick={openCreateInt}>
                <Plus className="h-4 w-4" />
                Ajouter une intervention
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {ints.map((i) => (
                <li
                  key={i.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/interventions/${i.id}`);
                    }
                  }}
                  className="cursor-pointer rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
                  onClick={() => router.push(`/interventions/${i.id}`)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="font-mono text-xs text-muted-foreground">{i.code}</p>
                      <p className="font-medium">
                        {INT_TYPE_LABEL[i.interventionType] ?? i.interventionType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {INT_STATUS_LABEL[i.status] ?? i.status}
                        {i.companyActor?.name ? ` · ${i.companyActor.name}` : i.companyName ? ` · ${i.companyName}` : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.plannedStart ? formatDate(i.plannedStart) : "—"}
                        {" → "}
                        {i.plannedEnd ? formatDate(i.plannedEnd) : "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditInt(i)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDelInt(i)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="risks" className="mt-6 space-y-4">
          <RelatedSectionToolbar
            action={
              <Button type="button" className="w-fit gap-1.5" onClick={openCreateRisk}>
                <Plus className="h-4 w-4" />
                Ajouter un risque
              </Button>
            }
          />
          {risks.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun risque lié à cette décision.
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditRisk(r)}>
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

      <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
            <DialogTitle>Ajouter un document</DialogTitle>
            <p className="text-left text-sm text-muted-foreground">
              Type obligatoire. Titre dérivé du nom de fichier automatiquement.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[min(40vh,280px)] px-6">
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
                <Label htmlFor="decision-doc-file">Fichier *</Label>
                <Input
                  id="decision-doc-file"
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUploadDocFile(f);
                    if (f) setUploadDocError(null);
                  }}
                />
                {uploadDocFile ? (
                  <p className="text-xs text-muted-foreground">
                    Fichier sélectionné : <span className="font-medium text-foreground">{uploadDocFile.name}</span>
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
                if (!uploadDocFile) {
                  setUploadDocError("Sélectionnez un fichier.");
                  return;
                }
                setUploadDocError(null);
                uploadDocMut.mutate(uploadDocFile);
              }}
            >
              {uploadDocMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDecOpen} onOpenChange={setEditDecOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>Modifier la décision</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[min(65vh,520px)] px-6">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={eType} onValueChange={setEType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEC_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DEC_TYPE_LABEL[t] ?? t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={eStatus} onValueChange={setEStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["DRAFT", "PROPOSED", "APPROVED", "SUPERSEDED", "CANCELLED"] as const).map((s) => (
                        <SelectItem key={s} value={s}>
                          {DEC_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de décision</Label>
                <Input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Principes doctrinaux</Label>
                <MultiSelectPopover
                  items={DOCTRINAL_PRINCIPLES_OPTIONS.map((p) => ({ id: p, label: p }))}
                  selected={ePrinciples}
                  onToggle={(id) =>
                    setEPrinciples((prev) => {
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
                <Textarea value={eJust} onChange={(e) => setEJust(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={2} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditDecOpen(false)}>
              Annuler
            </Button>
            <Button disabled={updateDecMut.isPending} onClick={() => updateDecMut.mutate()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={intOpen} onOpenChange={setIntOpen}>
        <DialogContent variant="viewport-centered">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>{editingInt ? "Modifier l’intervention" : "Nouvelle intervention"}</DialogTitle>
            <p className="text-left text-sm text-muted-foreground">
              Zone et décision : contexte automatique. Code généré côté serveur.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[min(70vh,560px)] px-6">
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type *</Label>
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
              {pathologyOptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Pathologie liée (optionnel)</Label>
                  <Select value={iPathId} onValueChange={setIPathId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {pathologyOptions.map((p) => (
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
            <Button variant="outline" onClick={() => setIntOpen(false)}>
              Annuler
            </Button>
            <Button disabled={saveIntMut.isPending} onClick={() => saveIntMut.mutate()}>
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
          <ScrollArea className="max-h-[min(65vh,480px)] px-6">
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

      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette décision ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : les documents et risques liés à cette décision, le procès-verbal associé le cas
              échéant, et toutes les interventions rattachées (avec leurs documents, médias et risques) seront
              également supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={delDecMut.isPending} onClick={() => delDecMut.mutate()}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(delInt)} onOpenChange={(o) => !o && setDelInt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette intervention ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : les documents, médias et risques rattachés à cette intervention seront supprimés
              en cascade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelInt(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={delIntMut.isPending}
              onClick={() => delInt && delIntMut.mutate(delInt.id)}
            >
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
