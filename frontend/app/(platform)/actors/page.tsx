"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { MultiSelectPopover } from "@/components/shared/multi-select-popover";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { projectsApi, usersApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { useAuth } from "@/providers/auth-provider";
import type { ApiUser } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ActorsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [del, setDel] = useState<ApiUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const listQ = useQuery({
    queryKey: ["actors", "list", search],
    queryFn: () =>
      usersApi.list({
        page: 1,
        limit: 100,
        role: "ACTEUR",
        search: search.trim() || undefined,
      }),
    enabled: user?.role === "ADMIN",
  });
  const rows = listQ.data?.data ?? [];
  const projectsQ = useQuery({
    queryKey: ["projects", "list", "actor-assignments"],
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
    enabled: user?.role === "ADMIN",
  });
  const projectOptions = (projectsQ.data?.data ?? []).map((project) => ({
    id: project.id,
    label: `${project.code} - ${project.name}`,
  }));
  const projectNameById = new Map((projectsQ.data?.data ?? []).map((project) => [project.id, project.name]));

  const openCreate = () => {
    setEditing(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelectedProjectIds([]);
    setOpen(true);
  };
  const openEdit = (a: ApiUser) => {
    setEditing(a);
    setFirstName(a.firstName);
    setLastName(a.lastName);
    setEmail(a.email);
    setSelectedProjectIds((a.projectAssignments ?? []).map((assignment) => assignment.projectId));
    setOpen(true);
  };

  const generateTemporaryInvitePassword = () =>
    `inv-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  const saveMut = useMutation({
    mutationFn: async () => {
      const saved = editing
        ? await usersApi.update(editing.id, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
          })
        : await usersApi.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            role: "ACTEUR",
            isActive: false,
            password: generateTemporaryInvitePassword(),
          });
      await usersApi.updateProjects(saved.id, { projectIds: selectedProjectIds });
      return saved;
    },
    onSuccess: async () => {
      toastSuccess(editing ? "Compte ACTEUR enregistré avec succès." : "Compte ACTEUR créé avec succès.");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["actors"] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: async () => {
      toastSuccess("Compte ACTEUR supprimé avec succès.");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["actors"] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Acteurs" }]} />
        <PageTitle title="Acteurs" description="Référentiel central des parties prenantes." />
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Accès réservé au rôle ADMIN.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Acteurs" }]} />
      <PageTitle title="Acteurs" description="Comptes utilisateurs avec rôle ACTEUR (validation)." />
      <ListFilterBar
        search={<SearchInput value={search} onChange={setSearch} className="w-full" placeholder="Rechercher un compte ACTEUR…" />}
      />
      <div className="flex justify-end">
        <Button type="button" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un compte ACTEUR
        </Button>
      </div>
      {listQ.isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.code}</TableCell>
                  <TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>ACTEUR</TableCell>
                  <TableCell>{a.isActive ? "Actif" : "Invité"}</TableCell>
                  <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                    {(a.projectAssignments ?? []).length
                      ? (a.projectAssignments ?? [])
                          .map((assignment) => projectNameById.get(assignment.projectId) ?? "Projet")
                          .join(", ")
                      : "Aucun projet"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => setDel(a)}>
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
        title={editing ? "Modifier le compte ACTEUR" : "Nouveau compte ACTEUR"}
        size="md"
        description={
          editing
            ? "Mise à jour d’un compte validateur ACTEUR."
            : "Création d’un compte utilisateur avec rôle ACTEUR."
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              type="button"
              disabled={saveMut.isPending || !firstName.trim() || !lastName.trim() || !email.trim()}
              onClick={() => saveMut.mutate()}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editing ? (
            <p className="text-xs text-muted-foreground">
              Code : <span className="font-mono text-foreground">{editing.code}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Le code sera généré automatiquement.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Prénom *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Nom *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Input value="ACTEUR" disabled />
          </div>
          <div className="space-y-2">
            <Label>Projets assignés</Label>
            <MultiSelectPopover
              items={projectOptions}
              selected={new Set(selectedProjectIds)}
              onToggle={(projectId) =>
                setSelectedProjectIds((current) =>
                  current.includes(projectId)
                    ? current.filter((id) => id !== projectId)
                    : [...current, projectId],
                )
              }
              placeholder="Aucun projet assigné"
              emptyMessage="Aucun projet disponible"
              summary={(count) => `${count} projet${count > 1 ? "s" : ""} assigné${count > 1 ? "s" : ""}`}
              disabled={projectsQ.isLoading}
            />
          </div>
        </div>
      </EntityFormModal>
      <EntityFormModal
        open={Boolean(del)}
        onOpenChange={(o) => !o && setDel(null)}
        title="Supprimer ce compte ACTEUR ?"
        variant="simple"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDel(null)}>Annuler</Button>
            <Button type="button" variant="destructive" disabled={deleteMut.isPending} onClick={() => del && deleteMut.mutate(del.id)}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {del ? `Le compte « ${del.firstName} ${del.lastName} » sera supprimé.` : "Suppression du compte."}
        </p>
      </EntityFormModal>
    </div>
  );
}
