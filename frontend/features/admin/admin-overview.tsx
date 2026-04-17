"use client";

import { PageTitle } from "@/components/shared/page-title";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api/resources";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FileText, FolderKanban, ShieldCheck, Users2, XCircle } from "lucide-react";
import Link from "next/link";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminOverview() {
  const { user } = useAuth();
  const overviewQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminApi.overview(),
    enabled: user?.role === "ADMIN",
  });

  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <PageTitle
          title="Supervision plateforme"
          description="Vue globale réservée au rôle ADMIN."
        />
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Accès réservé au rôle ADMIN.
        </div>
      </div>
    );
  }

  if (overviewQ.isLoading || !overviewQ.data) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Supervision plateforme"
          description="Vue globale de la plateforme, des comptes et des flux documentaires."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const { totals, actors, pendingDocuments, projects } = overviewQ.data;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Supervision plateforme"
        description="Lecture immédiate de l'état global, du suivi documentaire et des affectations."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Projets" value={totals.totalProjects} hint="Périmètre global" icon={FolderKanban} />
        <KpiCard title="Utilisateurs" value={totals.totalUsers} hint="Tous rôles confondus" icon={Users2} />
        <KpiCard title="Acteurs" value={totals.totalActors} hint="Référentiel terrain" icon={ShieldCheck} />
        <KpiCard title="Documents" value={totals.totalDocuments} hint="Base documentaire" icon={FileText} />
        <KpiCard title="En attente" value={totals.pendingDocuments} hint="A surveiller" icon={Clock3} />
        <KpiCard title="Approuvés" value={totals.approvedDocuments} hint="Flux validé" icon={CheckCircle2} />
        <KpiCard title="Rejetés" value={totals.rejectedDocuments} hint="Demandent reprise" icon={XCircle} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Pilotage admin</CardTitle>
            <CardDescription>Accès direct à la gestion des comptes et des acteurs.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/users">Gérer les utilisateurs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/actors">Gérer les acteurs</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents en attente</CardTitle>
          <CardDescription>Suivi global des documents non encore traités, sans action de validation ici.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Acteur responsable</TableHead>
                <TableHead>Assignés</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingDocuments.length ? (
                pendingDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      {document.title?.trim() || document.originalFilename}
                    </TableCell>
                    <TableCell>
                      {document.project ? `${document.project.code} - ${document.project.name}` : "Sans projet"}
                    </TableCell>
                    <TableCell>
                      {document.responsibleActor
                        ? `${document.responsibleActor.name}${document.responsibleActor.organization ? ` (${document.responsibleActor.organization})` : ""}`
                        : "Non renseigné"}
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                      {document.assignedUsers.length
                        ? document.assignedUsers.map((assigned) => assigned.name).join(", ")
                        : "Aucune affectation admin/acteur"}
                    </TableCell>
                    <TableCell>{formatDate(document.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun document en attente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Charge des acteurs</CardTitle>
            <CardDescription>Nombre de documents en attente par acteur.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Projets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actors.map((actor) => (
                  <TableRow key={actor.id}>
                    <TableCell className="font-medium">{actor.name}</TableCell>
                    <TableCell>{actor.organization || "—"}</TableCell>
                    <TableCell>{actor.pendingDocuments}</TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      {actor.projectAssignments.length
                        ? actor.projectAssignments.map((project) => project.name).join(", ")
                        : "Aucun projet"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supervision des projets</CardTitle>
            <CardDescription>Vue synthétique par projet, sans mélanger avec le cockpit opérationnel.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>En attente</TableHead>
                  <TableHead>Approuvés</TableHead>
                  <TableHead>Rejetés</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Acteurs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.code} - {project.name}</TableCell>
                    <TableCell>{project.documentsCount}</TableCell>
                    <TableCell>{project.pendingDocuments}</TableCell>
                    <TableCell>{project.approvedDocuments}</TableCell>
                    <TableCell>{project.rejectedDocuments}</TableCell>
                    <TableCell>{project.usersCount}</TableCell>
                    <TableCell>{project.actorsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
