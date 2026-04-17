"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DetailSection } from "@/components/shared/detail-section";
import { PageTitle } from "@/components/shared/page-title";
import { StatusBadge } from "@/components/shared/status-badge";
import { risksApi, zonesApi } from "@/lib/api/resources";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function RiskDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const riskQ = useQuery({
    queryKey: ["risk", id],
    queryFn: () => risksApi.get(id),
    enabled: Boolean(id),
  });
  const risk = riskQ.data;
  const zoneQ = useQuery({
    queryKey: ["zone", risk?.zoneId],
    queryFn: () => zonesApi.get(risk!.zoneId!),
    enabled: Boolean(risk?.zoneId),
  });
  const z = zoneQ.data ?? null;

  if (riskQ.isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (riskQ.isError || !risk) {
    return <p className="text-sm text-destructive">Risque introuvable.</p>;
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Risques", href: "/risks" },
          { label: risk.title },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={risk.status ?? "open"} />
      </div>
      <PageTitle title={risk.title} description={risk.riskCategory} />
      <DetailSection title="Évaluation">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Probabilité</dt>
            <dd className="font-medium capitalize">{(risk.probability ?? "—").replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Impact</dt>
            <dd className="font-medium capitalize">{risk.impact ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Propriétaire</dt>
            <dd className="font-medium">{risk.ownerName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Zone</dt>
            <dd className="font-medium">
              {z ? (
                <Link href={`/zones/${z.id}`} className="hover:underline">
                  {z.name ?? z.code}
                </Link>
              ) : (
                "Transverse"
              )}
            </dd>
          </div>
        </dl>
      </DetailSection>
      <DetailSection title="Mitigation">
        <p className="text-sm leading-relaxed">{risk.mitigation ?? "—"}</p>
      </DetailSection>
    </div>
  );
}
