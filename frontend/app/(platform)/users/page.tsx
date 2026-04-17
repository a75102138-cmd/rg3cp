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
import { projectsApi, usersApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { useAuth } from "@/providers/auth-provider";
import type { ApiUser, ApiUserRole } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const USER_ROLES: ApiUserRole[] = [
  "ADMIN",
  "USER",
  "ACTEUR",
];
const USER_ROLE_LABEL: Record<ApiUserRole, string> = {
  ADMIN: "Admin",
  USER: "Utilisateur",
  ACTEUR: "Acteur",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [del, setDel] = useState<ApiUser | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [defaultValidatorUserId, setDefaultValidatorUserId] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [validatorError, setValidatorError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["users", "list", search, roleFilter, activeFilter],
    queryFn: () =>
      usersApi.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        isActive:
          activeFilter === "all" ? undefined : activeFilter === "active" ? "true" : "false",
      }),
    enabled: user?.role === "ADMIN",
  });

  const rows = listQ.data?.data ?? [];
  const projectsQ = useQuery({
    queryKey: ["projects", "list", "admin-assignments"],
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
    enabled: user?.role === "ADMIN",
  });
  const projectOptions = (projectsQ.data?.data ?? []).map((project) => ({
    id: project.id,
    label: `${project.code} - ${project.name}`,
  }));
  const projectNameById = new Map((projectsQ.data?.data ?? []).map((project) => [project.id, project.name]));
  const validatorsQ = useQuery({
    queryKey: ["users", "list", "acteur-validators"],
    queryFn: () => usersApi.list({ page: 1, limit: 100, role: "ACTEUR", isActive: "true" }),
    enabled: user?.role === "ADMIN",
  });

  const openCreate = () => {
    setEditing(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setDefaultValidatorUserId("");
    setNameError(null);
    setEmailError(null);
    setValidatorError(null);
    setOpen(true);
  };

  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmail(u.email);
    setDefaultValidatorUserId(u.defaultValidatorUserId ?? "");
    setNameError(null);
    setEmailError(null);
    setValidatorError(null);
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return usersApi.update(editing.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        });
      }
      return usersApi.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: "USER",
        defaultValidatorUserId,
        isActive: false,
      });
    },
    onSuccess: async () => {
      toastSuccess(
        editing
          ? "Utilisateur enregistré avec succès."
          : "Utilisateur invité créé avec succès.",
      );
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: async () => {
      toastSuccess("Utilisateur supprimé avec succès.");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Utilisateurs" }]} />
        <PageTitle title="Utilisateurs" description="Gestion des comptes plateforme." />
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Accès réservé au rôle ADMIN.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Utilisateurs" }]} />
      <PageTitle title="Utilisateurs" description="Comptes d'accès à la plateforme." />

      <ListFilterBar
        filters={
          <div className="flex w-full flex-wrap gap-2 xl:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous rôles</SelectItem>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {USER_ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Invités</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            className="w-full"
            placeholder="Rechercher un utilisateur…"
          />
        }
      />

      <div className="flex justify-end">
        <Button type="button" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Créer un compte
        </Button>
      </div>

      {listQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table className="min-w-[920px]">
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
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.code}</TableCell>
                  <TableCell className="font-medium">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{USER_ROLE_LABEL[u.role]}</TableCell>
                  <TableCell>{u.isActive ? "Actif" : "Invité"}</TableCell>
                  <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                    {(u.projectAssignments ?? []).length
                      ? (u.projectAssignments ?? [])
                          .map((assignment) => projectNameById.get(assignment.projectId) ?? "Projet")
                          .join(", ")
                      : "Aucun projet"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive"
                      onClick={() => setDel(u)}
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
        title={editing ? "Modifier l’utilisateur" : "Créer un compte utilisateur"}
        size="md"
        description={
          editing
            ? "Mettez à jour les informations du compte."
            : "Création d’un compte invité USER (email d’activation envoyé automatiquement)."
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => {
                if (!firstName.trim() || !lastName.trim()) {
                  setNameError("Prénom et nom sont obligatoires.");
                  return;
                }
                if (!email.trim()) {
                  setEmailError("Email obligatoire.");
                  return;
                }
                if (!editing && !defaultValidatorUserId) {
                  setValidatorError("Le compte ACTEUR assigné est obligatoire.");
                  return;
                }
                setNameError(null);
                setEmailError(null);
                setValidatorError(null);
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
              Code: <span className="font-mono text-foreground">{editing.code}</span>
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                aria-invalid={Boolean(nameError)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                aria-invalid={Boolean(nameError)}
              />
            </div>
          </div>
          {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={Boolean(emailError)}
            />
            {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
          </div>

          {!editing ? (
            <div className="space-y-2">
              <Label>Compte ACTEUR valideur par défaut *</Label>
              <Select
                value={defaultValidatorUserId}
                onValueChange={(value) => {
                  setDefaultValidatorUserId(value);
                  if (validatorError) setValidatorError(null);
                }}
              >
                <SelectTrigger aria-invalid={Boolean(validatorError)}>
                  <SelectValue placeholder="Sélectionner un compte ACTEUR" />
                </SelectTrigger>
                <SelectContent>
                  {(validatorsQ.data?.data ?? []).map((validator) => (
                    <SelectItem key={validator.id} value={validator.id}>
                      {validator.code} - {validator.firstName} {validator.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validatorError ? <p className="text-sm text-destructive">{validatorError}</p> : null}
            </div>
          ) : (
            <div className="space-y-1 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p>
                Validateur ACTEUR assigné:{" "}
                <span className="font-medium text-foreground">
                  {editing.defaultValidator
                    ? `${editing.defaultValidator.firstName} ${editing.defaultValidator.lastName}`.trim()
                    : "Non renseigné"}
                </span>
              </p>
              <p>La mise à jour du validateur assigné sera gérée dans un écran dédié.</p>
            </div>
          )}
        </div>
      </EntityFormModal>

      <EntityFormModal
        open={Boolean(del)}
        onOpenChange={(o) => !o && setDel(null)}
        title="Supprimer cet utilisateur ?"
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
          {del ? `Le compte « ${del.firstName} ${del.lastName} » sera supprimé.` : "Suppression du compte."}
        </p>
      </EntityFormModal>
    </div>
  );
}

