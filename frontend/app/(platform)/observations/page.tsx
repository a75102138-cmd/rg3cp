"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { observationsForZoneIds } from "@/lib/api/project-scoped";
import { elementsApi, fetchAllPages, fetchZonesForProjectAsPaginated } from "@/lib/api/resources";
import { formatDateTime } from "@/lib/format";
import type { ApiObservation } from "@/types/api";
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
import { Input } from "@/components/ui/input";

const OBSERVATION_TYPES = [
  "SITE_VISUAL",
  "MEASURE",
  "CONDITION_SURVEY",
  "MONITORING",
  "PRE_INTERVENTION",
  "POST_INTERVENTION",
  "MEETING_NOTE",
  "OTHER",
] as const;

function formatEnumLabel(raw: string) {
  return raw.replaceAll("_", " ");
}

export default function ObservationsPage() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [zoneId, setZoneId] = useState<string>("all");
  const [elementId, setElementId] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [observationType, setObservationType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const zonesQ = useQuery({
    queryKey: ["zones", "list", projectId],
    queryFn: () => fetchZonesForProjectAsPaginated(projectId!),
    enabled: Boolean(projectId),
  });

  const zoneList = zonesQ.data?.data ?? [];
  const zoneIds = zoneList.map((z) => z.id);
  const zoneById = useMemo(() => new Map(zoneList.map((z) => [z.id, z])), [zoneList]);

  const obsQ = useQuery({
    queryKey: ["observations", "scoped", projectId, zoneIds.join(",")],
    queryFn: () => observationsForZoneIds(zoneIds),
    enabled: zoneIds.length > 0,
  });

  const elementsQ = useQuery({
    queryKey: ["elements", "project", projectId],
    queryFn: () =>
      fetchAllPages((page) => elementsApi.list({ projectId: projectId!, limit: 100, page })),
    enabled: Boolean(projectId),
  });

  const observations = obsQ.data ?? [];
  const elements = elementsQ.data ?? [];
  const elementById = useMemo(() => new Map(elements.map((e) => [e.id, e])), [elements]);

  const filtered = useMemo(() => {
    return observations.filter((o: ApiObservation) => {
      if (zoneId !== "all" && o.zoneId !== zoneId) return false;
      if (elementId === "none" && o.elementId != null) return false;
      if (elementId !== "all" && elementId !== "none" && o.elementId !== elementId) return false;
      if (severity !== "all") {
        const sev = (o.severity ?? "").toLowerCase();
        if (sev !== severity) return false;
      }
      if (observationType !== "all" && o.observationType !== observationType) return false;
      if (dateFrom && o.observedAt) {
        const d = new Date(o.observedAt);
        const from = new Date(dateFrom);
        if (d < from) return false;
      } else if (dateFrom && !o.observedAt) {
        return false;
      }
      if (dateTo && o.observedAt) {
        const d = new Date(o.observedAt);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      } else if (dateTo && !o.observedAt) {
        return false;
      }
      const hay = `${o.title} ${o.description ?? ""} ${o.observationType}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [observations, q, zoneId, elementId, severity, observationType, dateFrom, dateTo]);

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Observations" }]} />
        <p className="text-sm text-muted-foreground">Sélectionnez un projet dans l&apos;en-tête.</p>
      </div>
    );
  }

  const loading =
    zonesQ.isLoading || elementsQ.isLoading || (zoneIds.length > 0 && obsQ.isLoading);
  const error = zonesQ.isError || elementsQ.isError || obsQ.isError;

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Observations" }]} />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Observations" }]} />
        <p className="text-sm text-destructive">Erreur lors du chargement des observations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Observations" }]} />
        <PageTitle
          title="Registre des observations"
          description="Constats de terrain, sévérité et rattachement systématique à la zone (et à l’élément le cas échéant)."
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
            <Select value={elementId} onValueChange={setElementId}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Élément" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous éléments</SelectItem>
                <SelectItem value="none">Sans élément</SelectItem>
                {elements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sévérités</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={observationType} onValueChange={setObservationType}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {OBSERVATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatEnumLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex w-full flex-col gap-1 xl:w-auto">
              <label className="text-xs text-muted-foreground">Du</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex w-full flex-col gap-1 xl:w-auto">
              <label className="text-xs text-muted-foreground">Au</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </>
        }
        search={<SearchInput value={q} onChange={setQ} className="w-full" />}
      />

      {!zoneList.length ? (
        <p className="text-sm text-muted-foreground">Aucune zone pour ce projet — aucune observation à afficher.</p>
      ) : !filtered.length ? (
        <p className="text-sm text-muted-foreground">Aucune observation ne correspond aux filtres.</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Observation</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Sévérité</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Élément</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((o) => {
              const z = zoneById.get(o.zoneId);
              return (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/observations/${o.id}`} className="font-medium hover:underline">
                      {o.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{o.code}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{z?.code}</td>
                  <td className="px-4 py-3">
                    {o.severity ? (
                      <SeverityBadge severity={o.severity} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatEnumLabel(o.observationType)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.observedAt ? formatDateTime(o.observedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.elementId
                      ? (() => {
                          const el = elementById.get(o.elementId);
                          return el ? `${el.code}` : o.elementId.slice(0, 8);
                        })()
                      : "—"}
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
