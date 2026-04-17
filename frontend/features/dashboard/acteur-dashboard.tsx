"use client";

import { KpiCard } from "@/components/shared/kpi-card";
import { PageTitle } from "@/components/shared/page-title";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { documentsApi, fetchAllPages, usersApi } from "@/lib/api/resources";
import { useAuth } from "@/providers/auth-provider";
import type { ApiDocument } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FileCheck2, XCircle } from "lucide-react";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function mapDocStatus(status?: string): { badge: string; label: string } {
  if (status === "APPROVED") return { badge: "validated", label: "Validé" };
  if (status === "REJECTED") return { badge: "rejected", label: "Refusé" };
  return { badge: "under_review", label: "En attente" };
}

function projectName(projectId: string | null | undefined, projects: { id: string; name: string }[]): string {
  if (!projectId) return "Sans projet";
  return projects.find((p) => p.id === projectId)?.name ?? "Projet";
}

export function ActeurDashboard() {
  const { user } = useAuth();
  const dashboardQ = useQuery({
    queryKey: ["dashboard", "acteur", user?.id],
    enabled: Boolean(user?.id && user.role === "ACTEUR"),
    queryFn: async () => {
      const assignedProjects = await usersApi.getProjects(user!.id);
      const projectIds = assignedProjects.map((project) => project.id);

      const pendingByProject = await Promise.all(
        projectIds.map((projectId) =>
          fetchAllPages((page) => documentsApi.list({ projectId, status: "PENDING", limit: 100, page })),
        ),
      );
      const approvedByProject = await Promise.all(
        projectIds.map((projectId) =>
          fetchAllPages((page) => documentsApi.list({ projectId, status: "APPROVED", limit: 100, page })),
        ),
      );
      const rejectedByProject = await Promise.all(
        projectIds.map((projectId) =>
          fetchAllPages((page) => documentsApi.list({ projectId, status: "REJECTED", limit: 100, page })),
        ),
      );

      const pending = pendingByProject.flat().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      const approvedByMe = approvedByProject
        .flat()
        .filter((doc) => doc.validatedById === user!.id)
        .sort((a, b) => (b.validatedAt ?? b.createdAt ?? "").localeCompare(a.validatedAt ?? a.createdAt ?? ""));
      const rejectedByMe = rejectedByProject
        .flat()
        .filter((doc) => doc.validatedById === user!.id)
        .sort((a, b) => (b.validatedAt ?? b.createdAt ?? "").localeCompare(a.validatedAt ?? a.createdAt ?? ""));

      return { assignedProjects, pending, approvedByMe, rejectedByMe };
    },
  });

  if (dashboardQ.isLoading || !dashboardQ.data) {
    return <div className="h-40 animate-pulse rounded-xl border border-dashed bg-muted/40" />;
  }

  const { assignedProjects, pending, approvedByMe, rejectedByMe } = dashboardQ.data;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Mon espace validation"
        description="Suivi personnel des documents à traiter et de vos décisions récentes."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Docs assignés en attente" value={pending.length} hint="A valider" icon={Clock3} />
        <KpiCard title="Validés par moi" value={approvedByMe.length} hint="Historique récent" icon={CheckCircle2} />
        <KpiCard title="Refusés par moi" value={rejectedByMe.length} hint="Historique récent" icon={XCircle} />
        <KpiCard title="Projets assignés" value={assignedProjects.length} hint="Périmètre" icon={FileCheck2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Documents en attente (assignés)</CardTitle>
            <CardDescription>Votre file de validation par projet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.slice(0, 12).map((doc: ApiDocument) => {
              const status = mapDocStatus(doc.status);
              return (
                <div key={doc.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                    <StatusBadge status={status.badge}>{status.label}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {projectName(doc.projectId, assignedProjects)} · {formatDate(doc.createdAt)}
                  </p>
                </div>
              );
            })}
            {!pending.length ? <p className="text-sm text-muted-foreground">Aucun document en attente.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validations récentes</CardTitle>
              <CardDescription>Derniers documents validés par vous.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {approvedByMe.slice(0, 8).map((doc) => (
                <div key={doc.id} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {projectName(doc.projectId, assignedProjects)} · {formatDate(doc.validatedAt || doc.createdAt)}
                  </p>
                </div>
              ))}
              {!approvedByMe.length ? <p className="text-sm text-muted-foreground">Aucune validation récente.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refus récents</CardTitle>
              <CardDescription>Derniers documents refusés par vous.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rejectedByMe.slice(0, 8).map((doc) => (
                <div key={doc.id} className="rounded-xl border p-3">
                  <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {projectName(doc.projectId, assignedProjects)} · {formatDate(doc.validatedAt || doc.createdAt)}
                  </p>
                  {doc.remarks?.trim() ? <p className="mt-2 text-xs">{doc.remarks.trim()}</p> : null}
                </div>
              ))}
              {!rejectedByMe.length ? <p className="text-sm text-muted-foreground">Aucun refus récent.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
