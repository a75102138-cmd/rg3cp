"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
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
import { fetchAllPages, labTestsApi, materialsApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { formatDate } from "@/lib/format";
import type { ApiLabTest, ApiZone } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LAB_TYPES = [
  "PETROGRAPHY",
  "SALT_CHLORIDE",
  "MOISTURE",
  "MECHANICAL",
  "PIGMENT_BINDER",
  "RADIOGRAPHY",
  "DATING",
  "OTHER",
] as const;

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

const RESULTS = ["POSITIVE", "NEGATIVE", "INCONCLUSIVE", "PENDING", "OTHER"] as const;
const RES_LABEL: Record<string, string> = {
  POSITIVE: "Positif",
  NEGATIVE: "Négatif",
  INCONCLUSIVE: "Non conclusif",
  PENDING: "En attente",
  OTHER: "Autre",
};

type Props = { zone: ApiZone };

export function ZoneTabLabTests({ zone }: Props) {
  const qc = useQueryClient();
  const zoneId = zone.id;

  const listQ = useQuery({
    queryKey: ["zone-lab-tests", zoneId],
    queryFn: () =>
      fetchAllPages((page) => labTestsApi.list({ zoneId, limit: 100, page })),
    enabled: Boolean(zoneId),
  });

  const materialsQ = useQuery({
    queryKey: ["materials", "pick"],
    queryFn: () => fetchAllPages((page) => materialsApi.list({ limit: 100, page })),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiLabTest | null>(null);
  const [labTestType, setLabTestType] = useState<string>("OTHER");
  const [materialId, setMaterialId] = useState<string>("__none__");
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [laboratoryName, setLaboratoryName] = useState("");
  const [result, setResult] = useState<string>("__none__");
  const [testedAt, setTestedAt] = useState("");
  const [del, setDel] = useState<ApiLabTest | null>(null);

  const openCreate = () => {
    setEditing(null);
    setLabTestType("OTHER");
    setMaterialId("__none__");
    setMaterialError(null);
    setLaboratoryName("");
    setResult("__none__");
    setTestedAt("");
    setOpen(true);
  };

  const openEdit = (t: ApiLabTest) => {
    setEditing(t);
    setLabTestType(t.labTestType);
    setMaterialId(t.materialId ?? "__none__");
    setMaterialError(null);
    setLaboratoryName(t.laboratoryName ?? t.laboratoryActor?.name ?? "");
    setResult(t.result ?? "__none__");
    setTestedAt(t.testedAt ? t.testedAt.slice(0, 10) : "");
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        zoneId,
        labTestType,
        laboratoryName: laboratoryName.trim() || undefined,
        materialId: materialId === "__none__" ? undefined : materialId,
        testedAt: testedAt ? new Date(testedAt).toISOString() : undefined,
      };
      if (result !== "__none__") body.result = result;
      if (editing) return labTestsApi.update(editing.id, body);
      return labTestsApi.create(body);
    },
    onSuccess: async () => {
      toastSuccess(editing ? "Essai enregistré avec succès." : "Essai créé avec succès.");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["zone-lab-tests", zoneId] });
      await qc.invalidateQueries({ queryKey: ["zone", zoneId] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => labTestsApi.remove(id),
    onSuccess: async () => {
      toastSuccess("Essai supprimé avec succès.");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["zone-lab-tests", zoneId] });
      await qc.invalidateQueries({ queryKey: ["zone", zoneId] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const rows = listQ.data ?? [];
  const materials = materialsQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Essais de laboratoire liés à cette zone uniquement.</p>
        <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un essai
        </Button>
      </div>

      {listQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">Aucun essai pour cette zone</p>
          <p className="mt-1 text-sm text-muted-foreground">Enregistrez les analyses liées au chantier.</p>
          <Button type="button" className="mt-6 gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ajouter un essai
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Matériau</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Laboratoire</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/zones/${zoneId}/lab-tests/${t.id}`} className="hover:underline">
                      {t.code}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{LAB_LABEL[t.labTestType] ?? t.labTestType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.material ? `${t.material.code} — ${t.material.name}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.result ? RES_LABEL[t.result] ?? t.result : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.testedAt ? formatDate(t.testedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.laboratoryActor?.name ?? t.laboratoryName ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDel(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EntityFormModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Modifier l’essai" : "Nouvel essai"}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
                saveMut.mutate();
              }}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Zone : {zone.code} (implicite)</p>
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  Code : <span className="font-mono text-foreground">{editing.code}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Le code sera généré automatiquement.</p>
              )}
              <div className="space-y-2">
                <Label>Type d’essai *</Label>
                <Select value={labTestType} onValueChange={setLabTestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAB_TYPES.map((x) => (
                      <SelectItem key={x} value={x}>
                        {LAB_LABEL[x]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Matériau *</Label>
                <Select value={materialId} onValueChange={setMaterialId}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-2">
                <Label>Laboratoire</Label>
                <Input
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  placeholder="Nom du laboratoire (optionnel)"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label>Résultat</Label>
                <Select value={result} onValueChange={setResult}>
                  <SelectTrigger>
                    <SelectValue placeholder="Non évalué" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non renseigné</SelectItem>
                    {RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {RES_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date d’essai</Label>
                <Input type="date" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} />
              </div>
            </div>
      </EntityFormModal>

      <Dialog open={Boolean(del)} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cet essai ?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDel(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => del && deleteMut.mutate(del.id)}
              disabled={deleteMut.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
