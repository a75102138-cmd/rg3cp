"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { DecisionForm } from "@/features/decisions/decision-form";
import { decisionsApi } from "@/lib/api/resources";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

const STATUS_MAP_REVERSE: Record<string, "draft" | "under_review" | "validated" | "rejected"> = {
  DRAFT: "draft",
  PROPOSED: "under_review",
  APPROVED: "validated",
  SUPERSEDED: "rejected",
  CANCELLED: "rejected",
};

export default function EditDecisionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const dQ = useQuery({
    queryKey: ["decision", id, "edit-page"],
    queryFn: () => decisionsApi.get(id),
    enabled: Boolean(id),
  });
  const d = dQ.data;
  if (dQ.isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (dQ.isError || !d) return <p className="text-sm text-destructive">Décision introuvable.</p>;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Décisions", href: "/decisions" },
          { label: d.title, href: `/decisions/${d.id}` },
          { label: "Édition" },
        ]}
      />
      <PageTitle title="Modifier la décision" description={d.title} />
      <DecisionForm
        decisionId={d.id}
        defaultValues={{
          title: d.title,
          decisionType: d.decisionType,
          doctrinalPrinciples: d.doctrinalPrinciples ? d.doctrinalPrinciples.split(" | ") : [],
          justification: d.justification ?? "",
          zoneId: d.zoneId,
          observationId: d.observationId ?? "",
          pathologyId: d.pathologyId ?? "",
          validationStatus: STATUS_MAP_REVERSE[d.status] ?? "draft",
          decidedBy: d.authorName ?? "",
          decisionDate: d.decidedAt ? d.decidedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
