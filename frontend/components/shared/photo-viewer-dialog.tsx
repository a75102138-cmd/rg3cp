"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { photosApi } from "@/lib/api/resources";
import { effectivePhotoDateIso } from "@/lib/date-display";
import { formatDate } from "@/lib/format";
import type { ApiPhoto } from "@/types/api";
import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function photoLabel(photo: ApiPhoto): string {
  return photo.title?.trim() || photo.caption?.trim() || photo.originalFilename || photo.id;
}

/** DB may store `b2://bucket/key` — unusable as iframe/img src; only http(s) can preview inline. */
function onlyHttpUrl(u: string | undefined | null): string {
  const s = (u || "").trim();
  return /^https?:\/\//i.test(s) ? s : "";
}

type PhotoViewerDialogProps = {
  photo: ApiPhoto | null;
  onOpenChange: (open: boolean) => void;
  /** When true, show status and effective date like project document library. */
  showEffectiveDate?: boolean;
  emptyTitle?: string;
};

function viewerSubtitle(photo: ApiPhoto | null, showEffectiveDate: boolean): string {
  if (!photo) return "PENDING";
  const status = photo.status ?? "PENDING";
  if (!showEffectiveDate) return status;
  const iso = effectivePhotoDateIso(photo);
  return iso ? `${status} · ${formatDate(iso)}` : status;
}

/**
 * Large panel + signed https URL. Uses `<img object-contain>` so photos scale to fit (iframes show raw image size and scroll).
 * Never feeds `b2://…` into the preview — wait for `GET /photos/:id/download` (or Cloudinary https fallback).
 */
export function PhotoViewerDialog({
  photo,
  onOpenChange,
  showEffectiveDate = true,
  emptyTitle = "Photo",
}: PhotoViewerDialogProps) {
  const description = viewerSubtitle(photo, showEffectiveDate);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let active = true;
    async function resolveUrl() {
      if (!photo?.id) {
        if (active) {
          setResolvedUrl("");
          setResolving(false);
        }
        return;
      }
      setResolving(true);
      try {
        const data = await photosApi.download(photo.id);
        if (active) setResolvedUrl(data.url || "");
      } catch {
        if (active) setResolvedUrl("");
      } finally {
        if (active) setResolving(false);
      }
    }
    resolveUrl();
    return () => {
      active = false;
    };
  }, [photo?.id, photo?.secureUrl, photo?.url]);

  /** Prefer API signed URL; else direct https from record (Cloudinary); never `b2://`. */
  const openUrl =
    onlyHttpUrl(resolvedUrl) || onlyHttpUrl(photo?.secureUrl) || onlyHttpUrl(photo?.url) || "";

  return (
    <Dialog open={Boolean(photo)} onOpenChange={onOpenChange}>
      <DialogContent
        variant="viewer"
        className="!h-[92vh] !w-[90vw] !max-w-[1280px] overflow-hidden rounded-2xl border border-border/70 bg-card p-0 shadow-2xl"
      >
        <DialogHeader className="border-b border-border/60 bg-background/95">
          <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3 sm:px-5">
            <div className="min-w-0 pr-10">
              <DialogTitle className="truncate text-base sm:text-lg">
                {photo ? photoLabel(photo) : emptyTitle}
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
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2 sm:p-4">
            {openUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={openUrl}
                src={openUrl}
                alt={photo ? photoLabel(photo) : ""}
                className="h-auto w-auto max-h-[min(72vh,calc(100dvh-11rem))] max-w-full object-contain"
              />
            ) : resolving ? (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                Chargement de l’aperçu…
              </div>
            ) : (
              <div className="flex h-full min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
                Aperçu indisponible. Utilisez « Ouvrir » si le fichier est sur un stockage privé.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
