"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { effectiveDocumentDateIso } from "@/lib/date-display";
import { formatDateTime } from "@/lib/format";
import { labelForFileKind } from "@/features/projects/document-file-kinds";
import type { ApiDocument } from "@/types/api";
import { ctxLabel, docAttachKind } from "../hooks/use-documents-library";

type Props = {
  loading: boolean;
  filtered: ApiDocument[];
  zoneById: Map<string, { id: string; code: string }>;
  onOpen: (id: string) => void;
};

export function DocumentsLibraryGrid({ loading, filtered, zoneById, onOpen }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((d) => {
        const z = d.zoneId ? zoneById.get(d.zoneId) : null;
        const when = effectiveDocumentDateIso(d);
        return (
          <button key={d.id} type="button" className="text-left" onClick={() => onOpen(d.id)}>
            <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base leading-snug">{d.title?.trim() || d.originalFilename || "Document"}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {labelForFileKind(d.fileKind)} · {d.mimeType ?? "—"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {ctxLabel(docAttachKind(d))} · {when ? formatDateTime(when) : "—"}
                </p>
                {z ? <p>Zone {z.code}</p> : null}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

