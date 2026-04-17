"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { materialsApi } from "@/lib/api/resources";
import { MATERIAL_TYPES, MATERIAL_TYPE_LABEL_FR } from "@/lib/labels/material-type-fr";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import type { ApiMaterial } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function MaterialsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiMaterial | null>(null);
  const [del, setDel] = useState<ApiMaterial | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("OTHER");
  const [origin, setOrigin] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["materials", "list", search],
    queryFn: () => materialsApi.list({ page: 1, limit: 100, search: search.trim() || undefined }),
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("OTHER");
    setOrigin("");
    setCompatibility("");
    setNameError(null);
    setOpen(true);
  };

  const openEdit = (m: ApiMaterial) => {
    setEditing(m);
    setName(m.name);
    setType(m.type);
    setOrigin(m.origin ?? "");
    setCompatibility(m.compatibility ?? "");
    setNameError(null);
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        type,
        origin: origin.trim() || undefined,
        compatibility: compatibility.trim() || undefined,
      };
      if (editing) return materialsApi.update(editing.id, body);
      return materialsApi.create(body);
    },
    onSuccess: async () => {
      toastSuccess(editing ? "Matériau enregistré avec succès." : "Matériau créé avec succès.");
      setOpen(false);
      setNameError(null);
      await qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => materialsApi.remove(id),
    onSuccess: async () => {
      toastSuccess("Matériau supprimé avec succès.");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  const rows = listQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Matériaux" }]} />
      <PageTitle
        title="Catalogue des matériaux"
        description="Référentiel partagé pour les éléments architecturaux et les essais laboratoire."
      />

      <ListFilterBar
        search={<SearchInput value={search} onChange={setSearch} className="w-full" placeholder="Rechercher un matériau…" />}
      />

      <div className="flex justify-end">
        <Button type="button" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un matériau
        </Button>
      </div>

      {listQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">Aucun matériau</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez un matériau pour le rendre disponible dans les éléments et les essais.
          </p>
          <Button type="button" className="mt-6 gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ajouter un matériau
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provenance</TableHead>
                <TableHead>Compatibilité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{MATERIAL_TYPE_LABEL_FR[(m.type as keyof typeof MATERIAL_TYPE_LABEL_FR) ?? "OTHER"] ?? m.type}</TableCell>
                  <TableCell className="text-muted-foreground">{m.origin?.trim() ? m.origin : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.compatibility?.trim() ? m.compatibility : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive"
                      onClick={() => setDel(m)}
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

      <EntityFormModal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Modifier le matériau" : "Nouveau matériau"}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => {
                if (!name.trim()) {
                  setNameError("Le nom est obligatoire.");
                  return;
                }
                setNameError(null);
                saveMut.mutate();
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editing ? (
            <p className="text-xs text-muted-foreground">
              Code : <span className="font-mono text-foreground">{editing.code}</span> (généré automatiquement)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Le code sera généré automatiquement.</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="material-name">Nom *</Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              aria-invalid={Boolean(nameError)}
            />
            {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-type">Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="material-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MATERIAL_TYPE_LABEL_FR[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-origin">Provenance</Label>
            <Input id="material-origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-compatibility">Compatibilité</Label>
            <Input
              id="material-compatibility"
              value={compatibility}
              onChange={(e) => setCompatibility(e.target.value)}
            />
          </div>
        </div>
      </EntityFormModal>

      <EntityFormModal
        open={Boolean(del)}
        onOpenChange={(o) => !o && setDel(null)}
        title="Supprimer ce matériau ?"
        variant="simple"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDel(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => del && deleteMut.mutate(del.id)}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {del ? `Le matériau « ${del.name} » sera supprimé.` : "Suppression du matériau."}
        </p>
      </EntityFormModal>
    </div>
  );
}
