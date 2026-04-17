"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailSummaryCard } from "@/components/shared/detail-summary-card";
import { PageTitle } from "@/components/shared/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { actorsApi } from "@/lib/api/resources";
import { ACTOR_ROLE_LABEL_FR } from "@/lib/labels/actor-role-fr";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ActorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const q = useQuery({ queryKey: ["actor", id], queryFn: () => actorsApi.get(id), enabled: Boolean(id) });
  const a = q.data;
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Acteurs", href: "/actors" }, { label: a?.name ?? "Détail" }]} />
      {q.isLoading ? <Skeleton className="h-24 w-full rounded-xl" /> : <PageTitle title={a?.name ?? "Acteur"} description={a?.code ? `Code : ${a.code}` : undefined} />}
      <DetailSummaryCard title="Fiche acteur">
        {q.isLoading ? <Skeleton className="h-28 w-full rounded-xl" /> : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Rôle</dt><dd className="font-medium">{a ? (ACTOR_ROLE_LABEL_FR[(a.role as keyof typeof ACTOR_ROLE_LABEL_FR) ?? "OTHER"] ?? a.role) : "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Organisation</dt><dd className="font-medium">{a?.organization?.trim() ? a.organization : "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Email</dt><dd className="font-medium">{a?.email?.trim() ? a.email : "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Téléphone</dt><dd className="font-medium">{a?.phone?.trim() ? a.phone : "—"}</dd></div>
          </dl>
        )}
      </DetailSummaryCard>
    </div>
  );
}
