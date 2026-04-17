"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { labTestsApi } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const LAB_LABEL: Record<string, string> = {
  PETROGRAPHY: "Pétrographie",
  SALT_CHLORIDE: "Sels / chlorures",
  MOISTURE: "Humidité",
  MECHANICAL: "Mécanique",
  PIGMENT_BINDER: "Liant / pigment",
  RADIOGRAPHY: "Radiographie",
  DATING: "Datation",
  OTHER: "Autre",
};

const RES_LABEL: Record<string, string> = {
  POSITIVE: "Positif",
  NEGATIVE: "Négatif",
  INCONCLUSIVE: "Non conclusif",
  PENDING: "En attente",
  OTHER: "Autre",
};

export default function LabTestDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const q = useQuery({
    queryKey: ["lab-test", id],
    queryFn: () => labTestsApi.get(id),
    enabled: Boolean(id),
  });

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Essai introuvable.</p>
        <Link href="/lab-tests" className="text-sm text-primary hover:underline">
          Retour à la liste des essais
        </Link>
      </div>
    );
  }
  const t = q.data;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Essais labo", href: "/lab-tests" },
          { label: t.code },
        ]}
      />
      <PageTitle
        title={LAB_LABEL[t.labTestType] ?? t.labTestType}
        description={`Code ${t.code}`}
      />
      <div className="rounded-xl border bg-card p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{LAB_LABEL[t.labTestType] ?? t.labTestType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Matériau</dt>
            <dd className="font-medium">
              {t.material ? (
                <Link href={`/materials/${t.material.id}`} className="hover:underline">
                  {t.material.code} — {t.material.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">{t.testedAt ? formatDate(t.testedAt) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Laboratoire</dt>
            <dd className="font-medium">{t.laboratoryName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Résultat</dt>
            <dd className="font-medium">{t.result ? RES_LABEL[t.result] ?? t.result : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Zone</dt>
            <dd className="font-medium">
              {t.zone ? <Link href={`/zones/${t.zone.id}`} className="hover:underline">{t.zone.code}</Link> : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Rapport / document</dt>
            <dd className="font-medium">
              {t.reportDocument ? (
                <Link href={`/documents/${t.reportDocument.id}`} className="hover:underline">
                  {t.reportDocument.title || t.reportDocument.originalFilename || t.reportDocument.id}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
