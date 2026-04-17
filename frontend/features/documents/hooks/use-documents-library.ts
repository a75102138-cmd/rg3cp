"use client";

import { clientRangeFromPreset, effectiveDocumentDateIso, type DatePreset } from "@/lib/date-display";
import { fetchAllDocumentsForProject, fetchAllZonesForProject } from "@/lib/api/resources";
import type { ApiDocument } from "@/types/api";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type DocCtx = "all" | "project" | "zone" | "observation" | "pathology" | "decision" | "intervention" | "logbook";

export function docAttachKind(d: ApiDocument): DocCtx {
  if (d.observationId) return "observation";
  if (d.pathologyId) return "pathology";
  if (d.decisionId) return "decision";
  if (d.interventionId) return "intervention";
  if (d.logbookId) return "logbook";
  if (d.zoneId) return "zone";
  return "project";
}

export const CTX_LABEL: Record<Exclude<DocCtx, "all">, string> = {
  project: "Projet seul",
  zone: "Zone",
  observation: "Observation",
  pathology: "Pathologie",
  decision: "Décision",
  intervention: "Intervention",
  logbook: "Journal",
};

export function ctxLabel(kind: DocCtx): string {
  if (kind === "all") return "—";
  return CTX_LABEL[kind];
}

export function useDocumentsLibraryData() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [fileKind, setFileKind] = useState<string>("all");
  const [zoneId, setZoneId] = useState<string>("all");
  const [ctx, setCtx] = useState<DocCtx>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const doc = searchParams.get("doc");
    if (doc) {
      setActiveId(doc);
      setOpen(true);
    }
  }, [searchParams]);

  const docsQ = useQuery({
    queryKey: ["documents", "project", projectId],
    queryFn: () => fetchAllDocumentsForProject(projectId!),
    enabled: Boolean(projectId),
  });

  const zonesQ = useQuery({
    queryKey: ["zones", "documents-lib", projectId],
    queryFn: () => fetchAllZonesForProject(projectId!),
    enabled: Boolean(projectId),
  });

  const rows = docsQ.data ?? [];
  const zones = zonesQ.data ?? [];
  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);

  const fileKinds = useMemo(() => {
    const s = new Set<string>();
    for (const d of rows) if (d.fileKind) s.add(d.fileKind);
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((d) => {
      if (fileKind !== "all" && (d.fileKind ?? "") !== fileKind) return false;
      if (zoneId !== "all") {
        if (zoneId === "none" && d.zoneId != null) return false;
        if (zoneId !== "none" && d.zoneId !== zoneId) return false;
      }
      if (ctx !== "all" && docAttachKind(d) !== ctx) return false;
      const eff = effectiveDocumentDateIso(d);
      if (datePreset) {
        const { from, to } = clientRangeFromPreset(datePreset);
        if (!eff) return false;
        const t = new Date(eff).getTime();
        if (t < from.getTime() || t > to.getTime()) return false;
      } else {
        if (dateFrom) {
          if (!eff) return false;
          if (new Date(eff) < new Date(dateFrom)) return false;
        }
        if (dateTo && eff) {
          const t = new Date(eff);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (t > to) return false;
        } else if (dateTo && !eff) {
          return false;
        }
      }
      const hay = `${d.title ?? ""} ${d.originalFilename ?? ""} ${d.fileKind ?? ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, fileKind, zoneId, ctx, dateFrom, dateTo, datePreset]);

  const active = activeId ? rows.find((d) => d.id === activeId) ?? null : null;

  return {
    projectId,
    q,
    setQ,
    fileKind,
    setFileKind,
    zoneId,
    setZoneId,
    ctx,
    setCtx,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    datePreset,
    setDatePreset,
    open,
    setOpen,
    activeId,
    setActiveId,
    docsQ,
    zonesQ,
    rows,
    zones,
    zoneById,
    fileKinds,
    filtered,
    active,
  };
}

