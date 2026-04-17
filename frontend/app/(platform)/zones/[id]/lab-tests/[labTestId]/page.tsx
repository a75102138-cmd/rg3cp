"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSummaryCard } from "@/components/shared/detail-summary-card";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { RelatedSectionToolbar } from "@/components/shared/related-section-toolbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllPages, labTestsApi, materialsApi, zonesApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const LAB_LABEL: Record<string, string> = {
  PETROGRAPHY: "Pétrographie",
  SALT_CHLORIDE: "Sels / chlorures",
  MOISTURE: "Humidité",
  MECHANICAL: "Mécanique",
  PIGMENT_BINDER: "Liant / pigment",
  RADIOGRAPHY: "Radiographie",
  DATING: "Datation",
  OTHER: "Autre",
};

const RES_LABEL: Record<string, string> = {
  POSITIVE: "Positif",
  NEGATIVE: "Négatif",
  INCONCLUSIVE: "Non conclusif",
  PENDING: "En attente",
  OTHER: "Autre",
};

export default function ZoneLabTestDetailPage() {
  const params = useParams();
  const qc = useQueryClient();
  const zoneId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const labTestId =
    typeof params.labTestId === "string" ? params.labTestId : params.labTestId?.[0] ?? "";
  const [editMaterialOpen, setEditMaterialOpen] = useState(false);
  const [materialId, setMaterialId] = useState<string>("__none__");
  const [materialError, setMaterialError] = useState<string | null>(null);

  const zoneQ = useQuery({
    queryKey: ["zone", zoneId],
    queryFn: () => zonesApi.get(zoneId),
    enabled: Boolean(zoneId),
  });

  const testQ = useQuery({
    queryKey: ["lab-test", labTestId],
    queryFn: () => labTestsApi.get(labTestId),
    enabled: Boolean(labTestId),
  });
  const materialsQ = useQuery({
    queryKey: ["materials", "pick"],
    queryFn: () => fetchAllPages((page) => materialsApi.list({ limit: 100, page })),
  });

  useEffect(() => {
    setMaterialId(testQ.data?.materialId ?? "__none__");
    setMaterialError(null);
  }, [testQ.data?.materialId, testQ.data?.id]);

  const saveMaterialMut = useMutation({
    mutationFn: async () => {
      if (!labTestId) throw new Error("Essai introuvable.");
      if (materialId === "__none__") {
        throw new Error("Le matériau est obligatoire.");
      }
      return labTestsApi.update(labTestId, { materialId });
    },
    onSuccess: async () => {
      toastSuccess("Matériau lié à l’essai avec succès.");
      setEditMaterialOpen(false);
      await qc.invalidateQueries({ queryKey: ["lab-test", labTestId] });
      await qc.invalidateQueries({ queryKey: ["zone-lab-tests", zoneId] });
    },
    onError: (e) => toastMutationError(e),
  });

  const removeMaterialMut = useMutation({
    mutationFn: () => labTestsApi.update(labTestId, { materialId: null }),
    onSuccess: async () => {
      toastSuccess("Matériau retiré de l’essai.");
      await qc.invalidateQueries({ queryKey: ["lab-test", labTestId] });
      await qc.invalidateQueries({ queryKey: ["zone-lab-tests", zoneId] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  if (zoneQ.isLoading || testQ.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-80" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (zoneQ.isError || testQ.isError || !zoneQ.data || !testQ.data) {
    return <p className="text-sm text-destructive">Impossible de charger le détail de l’essai.</p>;
  }

  const zone = zoneQ.data;
  const t = testQ.data;
  const materials = materialsQ.data ?? [];
  const project = zone.project;

  if (t.zoneId !== zone.id) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Cet essai n’appartient pas à cette zone.</p>
        <Link href={`/zones/${zone.id}?tab=lab`} className="text-sm text-primary hover:underline">
          Retour aux essais de la zone
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projets", href: "/projects" },
          ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
          { label: "Zones", href: "/zones" },
          { label: zone.name, href: `/zones/${zone.id}?tab=lab` },
          { label: "Essais" },
          { label: t.code },
        ]}
      />

      <DetailHeader
        code={t.code}
        title={LAB_LABEL[t.labTestType] ?? t.labTestType}
        description="Détail de l’essai laboratoire dans le contexte de la zone."
      />

      <DetailSummaryCard title="Fiche essai">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Code</p>
            <p className="font-medium font-mono">{t.code}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{LAB_LABEL[t.labTestType] ?? t.labTestType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{t.testedAt ? formatDate(t.testedAt) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Laboratoire</p>
            <p className="font-medium">{t.laboratoryActor?.name ?? t.laboratoryName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Résultat</p>
            <p className="font-medium">{t.result ? RES_LABEL[t.result] ?? t.result : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rapport / document</p>
            <p className="font-medium">
              {t.reportDocument
                ? t.reportDocument.title || t.reportDocument.originalFilename || t.reportDocument.id
                : "—"}
            </p>
          </div>
        </div>
      </DetailSummaryCard>

      <section className="space-y-3">
        <RelatedSectionToolbar
          title="Matériaux"
          action={
            <Button type="button" size="sm" className="gap-1.5" onClick={() => setEditMaterialOpen(true)}>
              {t.material ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {t.material ? "Modifier le matériau" : "Ajouter un matériau"}
            </Button>
          }
        />

        {t.material ? (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">{t.material.code}</td>
                  <td className="px-4 py-3">
                    <Link href={`/materials/${t.material.id}`} className="font-medium hover:underline">
                      {t.material.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => setEditMaterialOpen(true)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive"
                        onClick={() => removeMaterialMut.mutate()}
                        disabled={removeMaterialMut.isPending}
                      >
                        {removeMaterialMut.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-6 py-10 text-center">
            <p className="font-medium">Aucun matériau lié</p>
            <p className="mt-1 text-sm text-muted-foreground">Associez un matériau pour compléter cet essai.</p>
          </div>
        )}
      </section>

      <EntityFormModal
        open={editMaterialOpen}
        onOpenChange={setEditMaterialOpen}
        title={t.material ? "Modifier le matériau lié" : "Ajouter un matériau"}
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditMaterialOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (materialId === "__none__") {
                  setMaterialError("Le matériau est obligatoire.");
                  return;
                }
                setMaterialError(null);
                saveMaterialMut.mutate();
              }}
              disabled={saveMaterialMut.isPending}
            >
              {saveMaterialMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Matériau *</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un matériau" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.code} — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {materialError ? <p className="text-sm text-destructive">{materialError}</p> : null}
          </div>
        </div>
      </EntityFormModal>
    </div>
  );
}
