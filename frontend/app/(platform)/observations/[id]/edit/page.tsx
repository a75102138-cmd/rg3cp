"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { ObservationForm } from "@/features/observations/observation-form";
import { observationsApi } from "@/lib/api/resources";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

const SEV_REVERSE: Record<string, "info" | "low" | "medium" | "high" | "critical"> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export default function EditObservationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const oQ = useQuery({
    queryKey: ["observation", id, "edit-page"],
    queryFn: () => observationsApi.get(id),
    enabled: Boolean(id),
  });
  const o = oQ.data;
  if (oQ.isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (oQ.isError || !o) return <p className="text-sm text-destructive">Observation introuvable.</p>;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Observations", href: "/observations" },
          { label: o.title, href: `/observations/${o.id}` },
          { label: "Édition" },
        ]}
      />
      <PageTitle title="Modifier l’observation" description={o.title} />
      <ObservationForm
        observationId={o.id}
        defaultValues={{
          title: o.title,
          description: o.description ?? "",
          severity: SEV_REVERSE[o.severity ?? "MEDIUM"] ?? "medium",
          category: o.observationType ?? "Autre",
          zoneId: o.zoneId,
          elementId: o.elementId ?? "",
          status: "recorded",
        }}
      />
    </div>
  );
}
