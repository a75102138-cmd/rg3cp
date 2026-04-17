"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { toBadgeStatus } from "@/lib/api/badge";
import {
  decisionsForZoneIds,
  interventionsForZoneIds,
  pathologiesForZoneIds,
} from "@/lib/api/project-scoped";
import { elementsApi, fetchAllPages, fetchZonesForProjectAsPaginated } from "@/lib/api/resources";
import { formatDate } from "@/lib/format";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERVENTION_TYPES = [
  "CLEANING",
  "CONSOLIDATION",
  "REPAIR",
  "REPLACEMENT_PARTIAL",
  "PROTECTION",
  "RE_INTEGRATION",
  "PROVISIONAL",
  "SURVEY",
  "OTHER",
] as const;

const INTERVENTION_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "VERIFIED", "CANCELLED"] as const;

export default function InterventionsPage() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [zoneId, setZoneId] = useState<string>("all");
  const [elementId, setElementId] = useState<string>("all");
  const [pathologyId, setPathologyId] = useState<string>("all");
  const [decisionId, setDecisionId] = useState<string>("all");
  const [interventionType, setInterventionType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const zonesQ = useQuery({
    queryKey: ["zones", "list", projectId],
    queryFn: () => fetchZonesForProjectAsPaginated(projectId!),
    enabled: Boolean(projectId),
  });

  const zoneList = zonesQ.data?.data ?? [];
  const zoneIds = zoneList.map((z) => z.id);
  const zoneById = useMemo(() => new Map(zoneList.map((z) => [z.id, z])), [zoneList]);

  const intQ = useQuery({
    queryKey: ["interventions", "scoped", projectId, zoneIds.join(",")],
    queryFn: () => interventionsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const pathQ = useQuery({
    queryKey: ["pathologies", "scoped", "int-page", projectId, zoneIds.join(",")],
    queryFn: () => pathologiesForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const decQ = useQuery({
    queryKey: ["decisions", "scoped", "int-page", projectId, zoneIds.join(",")],
    queryFn: () => decisionsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const elementsQ = useQuery({
    queryKey: ["elements", "project", "int-page", projectId],
    queryFn: () =>
      fetchAllPages((page) => elementsApi.list({ projectId: projectId!, limit: 100, page })),
    enabled: Boolean(projectId),
  });

  const list = intQ.data ?? [];
  const pathologies = pathQ.data ?? [];
  const decisions = decQ.data ?? [];
  const elements = elementsQ.data ?? [];

  const filtered = useMemo(() => {
    return list.filter((i) => {
      if (zoneId !== "all" && i.zoneId !== zoneId) return false;
      if (elementId === "none" && i.elementId != null) return false;
      if (elementId !== "all" && elementId !== "none" && i.elementId !== elementId) return false;
      if (pathologyId === "none" && i.pathologyId != null) return false;
      if (pathologyId !== "all" && pathologyId !== "none" && i.pathologyId !== pathologyId)
        return false;
      if (decisionId !== "all" && i.decisionId !== decisionId) return false;
      if (interventionType !== "all" && i.interventionType !== interventionType) return false;
      if (status !== "all" && i.status !== status) return false;
      if (!q.trim()) return true;
      const hay = `${i.interventionType} ${i.companyName ?? ""} ${i.status}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [list, q, zoneId, elementId, pathologyId, decisionId, interventionType, status]);
  const loading =
    zonesQ.isLoading ||
    elementsQ.isLoading ||
    (zoneIds.length > 0 && (intQ.isLoading || pathQ.isLoading || decQ.isLoading));
  const error =
    zonesQ.isError || elementsQ.isError || intQ.isError || pathQ.isError || decQ.isError;

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Interventions" }]} />
        <p className="text-sm text-muted-foreground">Sélectionnez un projet dans l&apos;en-tête.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-destructive">Erreur lors du chargement des interventions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Breadcrumbs items={[{ label: "Interventions" }]} />
          <PageTitle
            title="Interventions & chantier"
            description="Suivi opérationnel : entreprise, avancement et lien avec la décision source."
          />
        </div>
        <Button asChild variant="secondary">
          <Link href="/interventions/kanban">Vue Kanban</Link>
        </Button>
      </div>
      <ListFilterBar
        filters={
          <>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes zones</SelectItem>
                {zoneList.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={elementId} onValueChange={setElementId}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Élément" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="none">Sans élément</SelectItem>
                {elements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pathologyId} onValueChange={setPathologyId}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Pathologie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="none">Sans pathologie</SelectItem>
                {pathologies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={decisionId} onValueChange={setDecisionId}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Décision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes décisions</SelectItem>
                {decisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code} — {d.title.slice(0, 28)}
                    {d.title.length > 28 ? "…" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={interventionType} onValueChange={setInterventionType}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Type intervention" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {INTERVENTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {INTERVENTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        search={
          <SearchInput value={q} onChange={setQ} className="w-full" placeholder="Rechercher une intervention…" />
        }
      />
      {!zoneList.length ? (
        <p className="text-sm text-muted-foreground">Aucune zone pour ce projet.</p>
      ) : !filtered.length ? (
        <p className="text-sm text-muted-foreground">Aucune intervention enregistrée.</p>
      ) : null}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Intervention</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((i) => {
              const z = zoneById.get(i.zoneId);
              return (
                <tr key={i.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/interventions/${i.id}`} className="font-medium hover:underline">
                      {i.interventionType.replaceAll("_", " ")}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {i.plannedStart ? formatDate(i.plannedStart) : "—"}
                      {i.plannedEnd ? ` → ${formatDate(i.plannedEnd)}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{z?.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.companyName?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={toBadgeStatus(i.status)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
