"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { SeverityBadge } from "@/components/shared/severity-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { observationsForZoneIds, pathologiesForZoneIds } from "@/lib/api/project-scoped";
import { fetchZonesForProjectAsPaginated } from "@/lib/api/resources";
import type { ApiPathology } from "@/types/api";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

const PATHOLOGY_TYPES = [
  "CRACKING",
  "MOISTURE",
  "SALT_ATTACK",
  "DETACHMENT",
  "BIOLOGICAL_GROWTH",
  "MATERIAL_LOSS",
  "DEFORMATION",
  "CORROSION",
  "COATING_FAILURE",
  "OTHER",
] as const;

function formatEnumLabel(raw: string) {
  return raw.replaceAll("_", " ");
}

export default function PathologiesPage() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [zoneId, setZoneId] = useState<string>("all");
  const [pathologyType, setPathologyType] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [observationId, setObservationId] = useState<string>("all");

  const zonesQ = useQuery({
    queryKey: ["zones", "list", projectId],
    queryFn: () => fetchZonesForProjectAsPaginated(projectId!),
    enabled: Boolean(projectId),
  });

  const zoneList = zonesQ.data?.data ?? [];
  const zoneIds = zoneList.map((z) => z.id);
  const zoneById = useMemo(() => new Map(zoneList.map((z) => [z.id, z])), [zoneList]);

  const pathQ = useQuery({
    queryKey: ["pathologies", "scoped", projectId, zoneIds.join(",")],
    queryFn: () => pathologiesForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const obsQ = useQuery({
    queryKey: ["observations", "for-path-filters", projectId, zoneIds.join(",")],
    queryFn: () => observationsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const pathologies = pathQ.data ?? [];
  const observations = obsQ.data ?? [];

  const filtered = useMemo(() => {
    return pathologies.filter((p: ApiPathology) => {
      if (zoneId !== "all" && p.zoneId !== zoneId) return false;
      if (pathologyType !== "all" && p.pathologyType !== pathologyType) return false;
      if (severity !== "all") {
        const sev = (p.severity ?? "").toLowerCase();
        if (sev !== severity) return false;
      }
      if (observationId === "none" && p.observationId != null) return false;
      if (observationId !== "all" && observationId !== "none" && p.observationId !== observationId)
        return false;
      const hay = `${p.code} ${p.name} ${p.pathologyType} ${p.description ?? ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [pathologies, q, zoneId, pathologyType, severity, observationId]);

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Pathologies" }]} />
        <p className="text-sm text-muted-foreground">Sélectionnez un projet dans l&apos;en-tête.</p>
      </div>
    );
  }

  const loading =
    zonesQ.isLoading || (zoneIds.length > 0 && (pathQ.isLoading || obsQ.isLoading));
  const error = zonesQ.isError || pathQ.isError || obsQ.isError;

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Pathologies" }]} />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Pathologies" }]} />
        <p className="text-sm text-destructive">Erreur lors du chargement des pathologies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Pathologies" }]} />
        <PageTitle
          title="Pathologies & diagnostics"
          description="Hypothèses de cause, sévérité et lien avec les observations constitutives."
        />
      </div>

      <ListFilterBar
        filters={
          <>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger className="w-full xl:w-44">
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
            <Select value={pathologyType} onValueChange={setPathologyType}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Type pathologie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {PATHOLOGY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatEnumLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Gravité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={observationId} onValueChange={setObservationId}>
              <SelectTrigger className="w-full min-w-[12rem] xl:w-52">
                <SelectValue placeholder="Observation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes observations</SelectItem>
                <SelectItem value="none">Sans observation</SelectItem>
                {observations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.code} — {o.title.slice(0, 40)}
                    {o.title.length > 40 ? "…" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        search={
          <SearchInput value={q} onChange={setQ} className="w-full" placeholder="Rechercher…" />
        }
      />

      {!zoneList.length ? (
        <p className="text-sm text-muted-foreground">Aucune zone pour ce projet.</p>
      ) : !filtered.length ? (
        <p className="text-sm text-muted-foreground">Aucune pathologie ne correspond aux filtres.</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Pathologie</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Observation</th>
              <th className="px-4 py-3">Sévérité</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => {
              const z = zoneById.get(p.zoneId);
              const obs = p.observationId
                ? observations.find((o) => o.id === p.observationId)
                : null;
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/pathologies/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {formatEnumLabel(p.pathologyType)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{z?.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {obs ? (
                      <Link href={`/observations/${obs.id}`} className="hover:underline">
                        {obs.code}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={p.severity ?? "info"} />
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
