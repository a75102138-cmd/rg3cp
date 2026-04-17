"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { toBadgeStatus } from "@/lib/api/badge";
import {
  decisionsForZoneIds,
  observationsForZoneIds,
  pathologiesForZoneIds,
} from "@/lib/api/project-scoped";
import { fetchZonesForProjectAsPaginated } from "@/lib/api/resources";
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

const DECISION_TYPES = [
  "CONSERVATION_APPROACH",
  "INTERVENTION_PRINCIPLE",
  "MATERIAL_CHOICE",
  "METHODOLOGY",
  "VALIDATION_PV",
  "REGULATORY",
  "OTHER",
] as const;

const DECISION_STATUSES = ["DRAFT", "PROPOSED", "APPROVED", "SUPERSEDED", "CANCELLED"] as const;

export default function DecisionsPage() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [zoneId, setZoneId] = useState<string>("all");
  const [observationId, setObservationId] = useState<string>("all");
  const [pathologyId, setPathologyId] = useState<string>("all");
  const [decisionType, setDecisionType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const zonesQ = useQuery({
    queryKey: ["zones", "list", projectId],
    queryFn: () => fetchZonesForProjectAsPaginated(projectId!),
    enabled: Boolean(projectId),
  });

  const zoneList = zonesQ.data?.data ?? [];
  const zoneIds = zoneList.map((z) => z.id);
  const zoneById = useMemo(() => new Map(zoneList.map((z) => [z.id, z])), [zoneList]);

  const decQ = useQuery({
    queryKey: ["decisions", "scoped", projectId, zoneIds.join(",")],
    queryFn: () => decisionsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const obsQ = useQuery({
    queryKey: ["observations", "scoped", "decisions-page", projectId, zoneIds.join(",")],
    queryFn: () => observationsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const pathQ = useQuery({
    queryKey: ["pathologies", "scoped", "decisions-page", projectId, zoneIds.join(",")],
    queryFn: () => pathologiesForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const list = decQ.data ?? [];
  const observations = obsQ.data ?? [];
  const pathologies = pathQ.data ?? [];

  const filtered = useMemo(() => {
    return list.filter((d) => {
      if (zoneId !== "all" && d.zoneId !== zoneId) return false;
      if (observationId === "none" && d.observationId != null) return false;
      if (observationId !== "all" && observationId !== "none" && d.observationId !== observationId)
        return false;
      if (pathologyId === "none" && d.pathologyId != null) return false;
      if (pathologyId !== "all" && pathologyId !== "none" && d.pathologyId !== pathologyId)
        return false;
      if (decisionType !== "all" && d.decisionType !== decisionType) return false;
      if (status !== "all" && d.status !== status) return false;
      if (!q.trim()) return true;
      const hay = `${d.title} ${d.decisionType} ${d.status} ${d.authorName ?? ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [list, q, zoneId, observationId, pathologyId, decisionType, status]);
  const loading =
    zonesQ.isLoading ||
    (zoneIds.length > 0 && (decQ.isLoading || obsQ.isLoading || pathQ.isLoading));
  const error = zonesQ.isError || decQ.isError || obsQ.isError || pathQ.isError;

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Décisions" }]} />
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
        <p className="text-sm text-destructive">Erreur lors du chargement des décisions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Décisions" }]} />
        <PageTitle
          title="Registre des décisions"
          description="Principes doctrinaux, justifications et statut de validation."
        />
      </div>
      <ListFilterBar
        filters={
          <>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger className="w-full xl:w-40">
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
            <Select value={observationId} onValueChange={setObservationId}>
              <SelectTrigger className="w-full min-w-[10rem] xl:w-48">
                <SelectValue placeholder="Observation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="none">Sans observation</SelectItem>
                {observations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pathologyId} onValueChange={setPathologyId}>
              <SelectTrigger className="w-full min-w-[10rem] xl:w-48">
                <SelectValue placeholder="Pathologie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="none">Sans pathologie</SelectItem>
                {pathologies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name.slice(0, 32)}
                    {p.name.length > 32 ? "…" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={decisionType} onValueChange={setDecisionType}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Type décision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {DECISION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full xl:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {DECISION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        search={<SearchInput value={q} onChange={setQ} className="w-full" placeholder="Rechercher une décision…" />}
      />
      {!zoneList.length ? (
        <p className="text-sm text-muted-foreground">Aucune zone pour ce projet.</p>
      ) : !filtered.length ? (
        <p className="text-sm text-muted-foreground">Aucune décision enregistrée.</p>
      ) : null}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Décision</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((d) => {
              const z = zoneById.get(d.zoneId);
              return (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/decisions/${d.id}`} className="font-medium hover:underline">
                      {d.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {d.authorName?.trim() || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{z?.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.decisionType.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.decidedAt ? formatDate(d.decidedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={toBadgeStatus(d.status)} />
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
