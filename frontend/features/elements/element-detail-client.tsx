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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { actorsApi, elementsApi, fetchAllPages, materialsApi, observationsApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { ELEM_LABEL } from "@/lib/labels/element-type-fr";
import { segmentIdFromParams } from "@/lib/route-params";
import type { ApiElementDetail, ApiObservation } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const ELEMENT_TYPES = [
  "WALL",
  "FLOOR",
  "ROOF",
  "JOINERY",
  "STRUCTURAL_MEMBER",
  "DECORATIVE_FEATURE",
  "INSTALLATION",
  "FOUNDATION",
  "OTHER",
] as const;

const OBS_TYPES = [
  "SITE_VISUAL",
  "MEASURE",
  "CONDITION_SURVEY",
  "MONITORING",
  "PRE_INTERVENTION",
  "POST_INTERVENTION",
  "MEETING_NOTE",
  "OTHER",
] as const;

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

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const SEV_LABEL: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
};

export function ElementDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = segmentIdFromParams(params);
  const hasId = id.length > 0;
  const qc = useQueryClient();

  const elQ = useQuery({
    queryKey: ["element", id],
    queryFn: () => elementsApi.get(id),
    enabled: hasId,
  });

  const obsQ = useQuery({
    queryKey: ["observations", "element", id],
    queryFn: () =>
      fetchAllPages((page) => observationsApi.list({ elementId: id, limit: 100, page })),
    enabled: hasId,
  });
  const materialsQ = useQuery({
    queryKey: ["materials", "pick"],
    queryFn: () => fetchAllPages((page) => materialsApi.list({ limit: 100, page })),
  });

  const [editElOpen, setEditElOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [editingObs, setEditingObs] = useState<ApiObservation | null>(null);
  const [delEl, setDelEl] = useState(false);
  const [delObs, setDelObs] = useState<ApiObservation | null>(null);

  const [name, setName] = useState("");
  const [elementType, setElementType] = useState("OTHER");
  const [materialId, setMaterialId] = useState<string>("__none__");
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [elNameError, setElNameError] = useState<string | null>(null);
  const [obsTitleError, setObsTitleError] = useState<string | null>(null);

  const [oTitle, setOTitle] = useState("");
  const [oType, setOType] = useState<string>("CONDITION_SURVEY");
  const [oSev, setOSev] = useState<string>("__none__");
  const [oDesc, setODesc] = useState("");
  const [oAuthorActorId, setOAuthorActorId] = useState("__none__");
  const actorsQ = useQuery({
    queryKey: ["actors", "pick"],
    queryFn: () => fetchAllPages((page) => actorsApi.list({ page, limit: 100 })),
  });

  const openEditElement = (e: ApiElementDetail) => {
    setName(e.name);
    setElementType(e.elementType);
    setMaterialId(e.materialId ?? "__none__");
    setMaterialError(null);
    setDescription(e.description ?? "");
    setElNameError(null);
    setEditElOpen(true);
  };

  const openCreateObs = () => {
    setEditingObs(null);
    setOTitle("");
    setOType("CONDITION_SURVEY");
    setOSev("__none__");
    setODesc("");
    setOAuthorActorId("__none__");
    setObsTitleError(null);
    setObsOpen(true);
  };

  const openEditObs = (o: ApiObservation) => {
    setEditingObs(o);
    setOTitle(o.title);
    setOType(o.observationType);
    setOSev(o.severity ?? "__none__");
    setODesc(o.description ?? "");
    setOAuthorActorId(o.authorActorId ?? "__none__");
    setObsTitleError(null);
    setObsOpen(true);
  };

  const saveElMut = useMutation({
    mutationFn: async () => {
      const row = qc.getQueryData<ApiElementDetail>(["element", id]);
      if (!row) throw new Error("Élément introuvable.");
      const nameTrim = name.trim();
      return elementsApi.update(row.id, {
        name: nameTrim,
        elementType,
        description: description.trim() || undefined,
        materialId,
      });
    },
    onSuccess: async () => {
      toastSuccess("Élément enregistré avec succès.");
      setEditElOpen(false);
      setElNameError(null);
      await qc.invalidateQueries({ queryKey: ["element", id] });
    },
    onError: (e) => toastMutationError(e),
  });

  const delElMut = useMutation({
    mutationFn: async () => {
      const snap = qc.getQueryData<ApiElementDetail>(["element", id]);
      await elementsApi.remove(id);
      return snap;
    },
    onSuccess: async (snap) => {
      await qc.invalidateQueries({ queryKey: ["zone-elements"] });
      const zid = snap?.zoneId;
      if (zid) router.push(`/zones/${zid}?tab=elements`);
      else router.push("/zones");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const saveObsMut = useMutation({
    mutationFn: async () => {
      const row = qc.getQueryData<ApiElementDetail>(["element", id]);
      if (!row) throw new Error("Élément introuvable.");
      const title = oTitle.trim();
      const body = {
        zoneId: row.zoneId,
        elementId: row.id,
        title,
        observationType: oType,
        severity: oSev === "__none__" ? undefined : oSev,
        description: oDesc.trim() || undefined,
        authorActorId: oAuthorActorId === "__none__" ? undefined : oAuthorActorId,
      };
      if (editingObs) return observationsApi.update(editingObs.id, body);
      return observationsApi.create(body);
    },
    onSuccess: async () => {
      toastSuccess(editingObs ? "Observation enregistrée avec succès." : "Observation créée avec succès.");
      setObsOpen(false);
      setObsTitleError(null);
      await qc.invalidateQueries({ queryKey: ["observations", "element", id] });
      await qc.invalidateQueries({ queryKey: ["element", id] });
    },
    onError: (e) => toastMutationError(e),
  });

  const delObsMut = useMutation({
    mutationFn: (oid: string) => observationsApi.remove(oid),
    onSuccess: async () => {
      toastSuccess("Observation supprimée avec succès.");
      setDelObs(null);
      await qc.invalidateQueries({ queryKey: ["observations", "element", id] });
      await qc.invalidateQueries({ queryKey: ["element", id] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  if (!hasId) {
    return (
      <p className="text-sm text-muted-foreground">
        Identifiant d’élément absent de l’URL.{" "}
        <Button variant="link" className="px-0" onClick={() => router.back()}>
          Retour
        </Button>
      </p>
    );
  }

  if (elQ.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3 max-w-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (elQ.isError) {
    const status = elQ.error instanceof ApiError ? elQ.error.status : 0;
    const is404 = status === 404;
    return (
      <div className="space-y-3 text-sm">
        <p className={is404 ? "text-muted-foreground" : "text-destructive"}>
          {is404 ? "Élément introuvable." : "Impossible de charger l’élément."}
        </p>
        {!is404 && elQ.error instanceof ApiError ? (
          <p className="text-xs text-muted-foreground">{TOAST_MSG.loadFailed}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => elQ.refetch()}>
            Réessayer
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const el = elQ.data;
  if (!el) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3 max-w-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  const project = el.zone?.project;
  const zone = el.zone;
  const materialFromRef =
    el.materialId && !el.material ? (materialsQ.data ?? []).find((m) => m.id === el.materialId) ?? null : el.material;
  const obsRows = obsQ.data ?? [];
  return (
    <div className="space-y-8">
      <StickyPageToolbar>
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
            { label: "Zones", href: project ? `/projects/${project.id}` : "/zones" },
            ...(zone ? [{ label: zone.name, href: `/zones/${zone.id}?tab=elements` }] : []),
            { label: "Éléments", href: zone ? `/zones/${zone.id}?tab=elements` : "/elements" },
            { label: el.name },
          ]}
        />
      </StickyPageToolbar>

      <DetailHeader
        code={<span className="font-mono">{el.code}</span>}
        title={el.name}
        description={el.description ?? undefined}
        actions={
          <>
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => openEditElement(el)}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button type="button" variant="destructive" className="gap-1.5" onClick={() => setDelEl(true)}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </>
        }
      />

      <DetailSummaryCard title="Fiche élément">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Nom de l’élément</p>
            <p className="font-medium">{el.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type d’élément</p>
            <p className="font-medium">{ELEM_LABEL[el.elementType] ?? el.elementType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Matériau principal</p>
            {materialFromRef ? (
              <Link href={`/materials/${materialFromRef.id}`} className="font-medium text-primary hover:underline">
                {materialFromRef.code} — {materialFromRef.name}
              </Link>
            ) : (
              <p className="font-medium">—</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Description</p>
            <p className="mt-0.5 leading-relaxed">{el.description ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Zone</p>
            {zone ? (
              <Link href={`/zones/${zone.id}`} className="font-medium text-primary hover:underline">
                {zone.name} ({zone.code})
              </Link>
            ) : (
              "—"
            )}
          </div>
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
        </div>
      </DetailSummaryCard>

      <div className="space-y-3">
        <RelatedSectionToolbar
          title="Observations"
          action={
            <Button type="button" size="sm" className="w-fit gap-1.5" onClick={openCreateObs}>
              <Plus className="h-4 w-4" />
              Ajouter une observation
            </Button>
          }
        />

        {obsQ.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : obsRows.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="font-medium">Aucune observation pour cet élément</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les constatations seront rattachées automatiquement à cette zone et à cet élément.
            </p>
            <Button type="button" className="mt-6 gap-1.5" onClick={openCreateObs}>
              <Plus className="h-4 w-4" />
              Ajouter une observation
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre / code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Gravité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obsRows.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/observations/${o.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">{o.title}</span>
                      <p className="font-mono text-xs text-muted-foreground">{o.code}</p>
                    </TableCell>
                    <TableCell className="text-sm">{OBS_LABEL[o.observationType] ?? o.observationType}</TableCell>
                    <TableCell className="text-sm">
                      {o.severity ? SEV_LABEL[o.severity] ?? o.severity : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.observedAt ? formatDate(o.observedAt) : "—"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {o.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEditObs(o);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setDelObs(o);
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
      </div>

      <EntityFormModal
        open={editElOpen}
        onOpenChange={setEditElOpen}
        title="Modifier l’élément"
        description={
          <>
            Code : <span className="font-mono text-foreground">{el.code}</span>
            <br />
            Zone : contexte figé — {el.zone ? `${el.zone.code} — ${el.zone.name}` : "—"}
          </>
        }
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditElOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setElNameError("Le nom est obligatoire.");
                  return;
                }
                if (materialId === "__none__") {
                  setMaterialError("Le matériau principal est obligatoire.");
                  return;
                }
                setElNameError(null);
                setMaterialError(null);
                saveElMut.mutate();
              }}
              disabled={saveElMut.isPending}
            >
              {saveElMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="el-edit-name">Nom de l’élément *</Label>
            <Input
              id="el-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (elNameError) setElNameError(null);
              }}
              maxLength={255}
              aria-invalid={Boolean(elNameError)}
            />
            {elNameError ? <p className="text-sm text-destructive">{elNameError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="el-edit-type">Type d’élément *</Label>
            <Select value={elementType} onValueChange={setElementType}>
              <SelectTrigger id="el-edit-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ELEM_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="el-edit-material">Matériau principal *</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger id="el-edit-material">
                <SelectValue placeholder="Sélectionner un matériau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sélectionner un matériau</SelectItem>
                {(materialsQ.data ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {materialError ? <p className="text-sm text-destructive">{materialError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="el-edit-desc">Description</Label>
            <Textarea id="el-edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
      </EntityFormModal>

      <EntityFormModal
        open={obsOpen}
        onOpenChange={setObsOpen}
        title={editingObs ? "Modifier l’observation" : "Nouvelle observation"}
        description={`Zone et élément : contexte automatique (${zone?.code} · ${el.name})`}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setObsOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!oTitle.trim()) {
                  setObsTitleError("Le titre est obligatoire.");
                  return;
                }
                setObsTitleError(null);
                saveObsMut.mutate();
              }}
              disabled={saveObsMut.isPending}
            >
              {saveObsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={oTitle}
              onChange={(e) => {
                setOTitle(e.target.value);
                if (obsTitleError) setObsTitleError(null);
              }}
              maxLength={500}
              aria-invalid={Boolean(obsTitleError)}
            />
            {obsTitleError ? <p className="text-sm text-destructive">{obsTitleError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Type d’observation *</Label>
            <Select value={oType} onValueChange={setOType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {OBS_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gravité</Label>
            <Select value={oSev} onValueChange={setOSev}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEV_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={oDesc} onChange={(e) => setODesc(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Auteur (optionnel)</Label>
            <Select value={oAuthorActorId} onValueChange={setOAuthorActorId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un acteur" />
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
      </EntityFormModal>

      <Dialog open={Boolean(delObs)} onOpenChange={(o) => !o && setDelObs(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette observation ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : pathologies, décisions liées à cette observation, documents et médias
              rattachés à l’observation seront supprimés en cascade (voir politique serveur).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDelObs(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => delObs && delObsMut.mutate(delObs.id)}
              disabled={delObsMut.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delEl} onOpenChange={setDelEl}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cet élément ?</DialogTitle>
            <DialogDescription className="text-left">
              Suppression définitive : toutes les observations rattachées à cet élément seront supprimées, ainsi que la
              chaîne descendante (pathologies, décisions, interventions, documents, médias et risques concernés), et
              les médias rattachés directement à l’élément. Le matériau catalogue n’est pas supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDelEl(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={() => delElMut.mutate()} disabled={delElMut.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
