"use client";

import { KpiCard } from "@/components/shared/kpi-card";
import { PageTitle } from "@/components/shared/page-title";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { documentsApi, fetchAllPages } from "@/lib/api/resources";
import { useAuth } from "@/providers/auth-provider";
import type { ApiDocument } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";

function userLabel(doc: ApiDocument): string {
  const fullName = [doc.uploadedBy?.firstName, doc.uploadedBy?.lastName].filter(Boolean).join(" ").trim();
  return fullName || doc.uploadedBy?.email || "—";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function mapDocStatus(status?: string): { badge: string; label: string } {
  if (status === "APPROVED") return { badge: "validated", label: "Validé" };
  if (status === "REJECTED") return { badge: "rejected", label: "Refusé" };
  return { badge: "under_review", label: "En attente" };
}

export function UserDashboard() {
  const { user } = useAuth();
  const docsQ = useQuery({
    queryKey: ["dashboard", "user", "documents", user?.id],
    enabled: Boolean(user?.id && user.role === "USER"),
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        fetchAllPages((page) => documentsApi.list({ status: "PENDING", limit: 100, page })),
        fetchAllPages((page) => documentsApi.list({ status: "APPROVED", limit: 100, page })),
        fetchAllPages((page) => documentsApi.list({ status: "REJECTED", limit: 100, page })),
      ]);
      const all = [...pending, ...approved, ...rejected].filter((doc) => doc.uploadedById === user!.id);
      const deduped = Array.from(new Map(all.map((doc) => [doc.id, doc])).values());
      const byCreated = [...deduped].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        all: byCreated,
        pending: byCreated.filter((d) => d.status === "PENDING"),
        approved: byCreated.filter((d) => d.status === "APPROVED"),
        rejected: byCreated.filter((d) => d.status === "REJECTED"),
      };
    },
  });

  if (docsQ.isLoading || !docsQ.data) {
    return <div className="h-40 animate-pulse rounded-xl border border-dashed bg-muted/40" />;
  }

  const { all, pending, approved, rejected } = docsQ.data;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Mon suivi documentaire"
        description="Vue personnelle de vos documents déposés, statuts et retours."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Mes documents" value={all.length} hint="Tous statuts" icon={FileText} />
        <KpiCard title="En attente" value={pending.length} hint="En cours de revue" icon={Clock3} />
        <KpiCard title="Validés" value={approved.length} hint="Conformes" icon={CheckCircle2} />
        <KpiCard title="Refusés" value={rejected.length} hint="Avec remarques" icon={XCircle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Mes dépôts récents</CardTitle>
            <CardDescription>Vos derniers documents déposés, quel que soit le statut.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {all.slice(0, 10).map((doc) => {
              const status = mapDocStatus(doc.status);
              return (
                <div key={doc.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                    <StatusBadge status={status.badge}>{status.label}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Déposé par {userLabel(doc)} · {formatDate(doc.createdAt)}
                  </p>
                </div>
              );
            })}
            {!all.length ? <p className="text-sm text-muted-foreground">Aucun document déposé.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refus récents</CardTitle>
              <CardDescription>Derniers documents refusés et motifs reçus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rejected.slice(0, 6).map((doc) => (
                <div key={doc.id} className="rounded-xl border p-3">
                  <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(doc.validatedAt || doc.createdAt)}</p>
                  <p className="mt-2 text-xs">{doc.remarks?.trim() || "Aucune remarque fournie."}</p>
                </div>
              ))}
              {!rejected.length ? <p className="text-sm text-muted-foreground">Aucun refus récent.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validations récentes</CardTitle>
              <CardDescription>Derniers documents validés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {approved.slice(0, 6).map((doc) => (
                <div key={doc.id} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{doc.title?.trim() || doc.originalFilename || doc.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.validatedAt || doc.createdAt)}</p>
                </div>
              ))}
              {!approved.length ? <p className="text-sm text-muted-foreground">Aucun document validé.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
