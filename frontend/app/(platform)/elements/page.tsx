"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { elementsApi, fetchAllPages, fetchAllZonesForProject } from "@/lib/api/resources";
import { ELEM_LABEL } from "@/lib/labels/element-type-fr";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

const ELEMENT_TYPES = Object.keys(ELEM_LABEL);

export default function ElementsPage() {
  const { projectId } = useProjectContext();
  const [q, setQ] = useState("");
  const [elementType, setElementType] = useState<string>("all");
  const [materialId, setMaterialId] = useState<string>("all");
  const [zoneId, setZoneId] = useState<string>("all");

  const listQ = useQuery({
    queryKey: ["elements", "project", projectId],
    queryFn: () =>
      fetchAllPages((page) => elementsApi.list({ projectId: projectId!, limit: 100, page })),
    enabled: Boolean(projectId),
  });

  const zonesQ = useQuery({
    queryKey: ["zones", "for-filters", projectId],
    queryFn: () => fetchAllZonesForProject(projectId!),
    enabled: Boolean(projectId),
  });

  const rows = listQ.data ?? [];
  const zoneList = zonesQ.data ?? [];

  const materialOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of rows) {
      if (e.material) m.set(e.material.id, e.material.name);
    }
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((e) => {
      if (zoneId !== "all" && e.zoneId !== zoneId) return false;
      if (elementType !== "all" && e.elementType !== elementType) return false;
      if (materialId !== "all" && e.materialId !== materialId) return false;
      if (!q.trim()) return true;
      const h = q.trim().toLowerCase();
      const mat = e.material ? `${e.material.code} ${e.material.name}` : "";
      const hay = `${e.code} ${e.name} ${e.elementType} ${mat} ${e.description ?? ""}`.toLowerCase();
      return hay.includes(h);
    });
  }, [rows, q, zoneId, elementType, materialId]);

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Éléments architecturaux" }]} />
        <PageTitle
          title="Éléments architecturaux"
          description="Sélectionnez un projet pour lister les éléments de ses zones."
        />
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Aucun projet sélectionné.
        </p>
      </div>
    );
  }

  if (listQ.isError) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Éléments architecturaux" }]} />
        <p className="text-sm text-destructive">Impossible de charger les éléments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Éléments architecturaux" }]} />
      <PageTitle
        title="Éléments architecturaux"
        description="Composants localisés dans les zones du projet sélectionné."
      />
      <ListFilterBar
        filters={
          <>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes zones</SelectItem>
                {zoneList.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.code} — {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={elementType} onValueChange={setElementType}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Type d’élément" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {ELEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ELEM_LABEL[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Matériau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous matériaux</SelectItem>
                {materialOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        search={
          <SearchInput
            value={q}
            onChange={setQ}
            className="w-full"
            placeholder="Rechercher (code, nom, type, matériau, description)…"
          />
        }
      />
      {listQ.isLoading || zonesQ.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? "Aucun élément pour ce projet — créez-en depuis l’onglet Éléments d’une zone."
            : "Aucun résultat pour ces filtres."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const z = e.zone;
            return (
              <Link key={e.id} href={`/elements/${e.id}`}>
                <article className="h-full rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                  <p className="text-xs text-muted-foreground">
                    {z ? `${z.code} — ${z.name}` : "Zone"}
                  </p>
                  <h2 className="text-lg font-semibold">{e.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {ELEM_LABEL[e.elementType] ?? e.elementType}
                    {e.material ? ` · ${e.material.name}` : ""}
                  </p>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
