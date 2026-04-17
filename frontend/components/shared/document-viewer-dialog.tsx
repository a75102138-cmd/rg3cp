"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { documentsApi } from "@/lib/api/resources";
import { effectiveDocumentDateIso } from "@/lib/date-display";
import { formatDate } from "@/lib/format";
import type { ApiDocument } from "@/types/api";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

function fixMojibake(value: string): string {
  if (!/[ÃÂâ]/.test(value)) return value;
  try {
    const repaired = decodeURIComponent(escape(value));
    if (!repaired) return value;
    const badScore = (value.match(/[ÃÂâ]/g) || []).length;
    const repairedScore = (repaired.match(/[ÃÂâ]/g) || []).length;
    return repairedScore < badScore ? repaired : value;
  } catch {
    return value;
  }
}

export function documentLabel(doc: ApiDocument): string {
  const raw = doc.originalFilename || doc.title?.trim() || doc.id;
  return fixMojibake(raw);
}

export function documentViewerSrc(doc: ApiDocument): string {
  const base = doc.secureUrl || doc.url || "";
  if (!base) return "";
  return doc.mimeType === "application/pdf"
    ? `${base}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`
    : base;
}

function withPdfViewerParams(url: string, mimeType?: string): string {
  if (!url) return "";
  return mimeType === "application/pdf"
    ? `${url}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`
    : url;
}

type DocumentViewerDialogProps = {
  doc: ApiDocument | null;
  onOpenChange: (open: boolean) => void;
  /** When true, append effective document date next to status (project library style). */
  showEffectiveDate?: boolean;
  /** Fallback title when doc is briefly null during close animation. */
  emptyTitle?: string;
};

function viewerSubtitle(doc: ApiDocument | null, showEffectiveDate: boolean): string {
  if (!doc) return "PENDING";
  const status = doc.status ?? "PENDING";
  if (!showEffectiveDate) return status;
  const iso = effectiveDocumentDateIso(doc);
  return iso ? `${status} · ${formatDate(iso)}` : status;
}

export function DocumentViewerDialog({
  doc,
  onOpenChange,
  showEffectiveDate = false,
  emptyTitle = "Document",
}: DocumentViewerDialogProps) {
  const description = viewerSubtitle(doc, showEffectiveDate);
  const [resolvedUrl, setResolvedUrl] = useState("");

  useEffect(() => {
    let active = true;
    async function resolveUrl() {
      if (!doc?.id) {
        if (active) setResolvedUrl("");
        return;
      }
      try {
        const data = await documentsApi.download(doc.id);
        if (active) setResolvedUrl(data.url || "");
      } catch {
        if (active) setResolvedUrl(doc.secureUrl || doc.url || "");
      }
    }
    resolveUrl();
    return () => {
      active = false;
    };
  }, [doc?.id, doc?.secureUrl, doc?.url]);

  const openUrl = resolvedUrl || doc?.secureUrl || doc?.url || "";
  const viewerUrl = withPdfViewerParams(openUrl, doc?.mimeType);

  return (
    <Dialog open={Boolean(doc)} onOpenChange={onOpenChange}>
      <DialogContent
        variant="viewer"
        className="!h-[92vh] !w-[90vw] !max-w-[1280px] overflow-hidden rounded-2xl border border-border/70 bg-card p-0 shadow-2xl"
      >
        <DialogHeader className="border-b border-border/60 bg-background/95">
          <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3 sm:px-5">
            <div className="min-w-0 pr-10">
              <DialogTitle className="truncate text-base sm:text-lg">
                {doc ? documentLabel(doc) : emptyTitle}
              </DialogTitle>
              <DialogDescription className="pt-0.5 text-left text-xs">{description}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-3.5"
              style={{ marginRight: 36 }}
              asChild
            >
              <a href={openUrl || "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-5">
          <div className="min-h-[76vh] flex-1 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
            <iframe
              title={doc ? documentLabel(doc) : emptyTitle}
              src={viewerUrl}
              className="h-full w-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
