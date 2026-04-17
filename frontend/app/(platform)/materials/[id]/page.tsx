"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { materialsApi } from "@/lib/api/resources";
import { MATERIAL_TYPE_LABEL_FR } from "@/lib/labels/material-type-fr";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MaterialDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const q = useQuery({
    queryKey: ["material", id],
    queryFn: () => materialsApi.get(id),
    enabled: Boolean(id),
  });

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Matériau introuvable.</p>
        <Link href="/materials" className="text-sm text-primary hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const m = q.data;
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Matériaux", href: "/materials" }, { label: m.name }]} />
      <PageTitle title={m.name} description={`Code ${m.code}`} />
      <div className="rounded-xl border bg-card p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">
              {MATERIAL_TYPE_LABEL_FR[(m.type as keyof typeof MATERIAL_TYPE_LABEL_FR) ?? "OTHER"] ?? m.type}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Provenance</dt>
            <dd className="font-medium">{m.origin?.trim() ? m.origin : "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Compatibilité</dt>
            <dd className="font-medium">{m.compatibility?.trim() ? m.compatibility : "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
