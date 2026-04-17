"use client";

import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DatePreset } from "@/lib/date-display";
import { labelForFileKind } from "@/features/projects/document-file-kinds";
import type { DocCtx } from "../hooks/use-documents-library";
import { CTX_LABEL } from "../hooks/use-documents-library";

type Props = {
  fileKind: string;
  setFileKind: (v: string) => void;
  fileKinds: string[];
  zoneId: string;
  setZoneId: (v: string) => void;
  zones: Array<{ id: string; code: string }>;
  ctx: DocCtx;
  setCtx: (v: DocCtx) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  datePreset: DatePreset | null;
  setDatePreset: (v: DatePreset | null) => void;
  q: string;
  setQ: (v: string) => void;
};

export function DocumentsLibraryFilters(props: Props) {
  const {
    fileKind,
    setFileKind,
    fileKinds,
    zoneId,
    setZoneId,
    zones,
    ctx,
    setCtx,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    datePreset,
    setDatePreset,
    q,
    setQ,
  } = props;
  return (
    <ListFilterBar
      filters={
        <>
          <Select value={fileKind} onValueChange={setFileKind}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue placeholder="Type document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {fileKinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {labelForFileKind(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes zones</SelectItem>
              <SelectItem value="none">Sans zone directe</SelectItem>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ctx} onValueChange={(v) => setCtx(v as DocCtx)}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue placeholder="Contexte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous contextes</SelectItem>
              {(Object.keys(CTX_LABEL) as Exclude<DocCtx, "all">[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {CTX_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">Du</span>
            <Input
              className="h-9 w-full min-w-0"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDatePreset(null);
                setDateFrom(e.target.value);
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">Au</span>
            <Input
              className="h-9 w-full min-w-0"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDatePreset(null);
                setDateTo(e.target.value);
              }}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span className="text-xs text-muted-foreground">Période (date du document)</span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["today", "Aujourd’hui"],
                  ["week", "Cette semaine"],
                  ["month", "Ce mois"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  variant={datePreset === key ? "secondary" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => setDatePreset(datePreset === key ? null : key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </>
      }
      search={<SearchInput value={q} onChange={setQ} className="w-full" placeholder="Rechercher…" />}
    />
  );
}

