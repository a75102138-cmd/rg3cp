"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/format";
import { labelForFileKind } from "@/features/projects/document-file-kinds";
import Link from "next/link";
import type { ApiDocument } from "@/types/api";
import { ctxLabel, docAttachKind } from "../hooks/use-documents-library";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  active: ApiDocument | null;
};

export function DocumentPreviewSheet({ open, onOpenChange, active }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {active ? (
          <>
            <SheetHeader>
              <SheetTitle>{active.title?.trim() || active.originalFilename}</SheetTitle>
              <SheetDescription>
                {labelForFileKind(active.fileKind)} · {active.mimeType}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {active.createdAt ? formatDateTime(active.createdAt) : "—"} · {ctxLabel(docAttachKind(active))}
              </p>
              {active.zoneId ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/zones/${active.zoneId}`}>Voir la zone</Link>
                </Button>
              ) : null}
              {active.secureUrl ? (
                <Button asChild className="w-full sm:w-auto">
                  <a href={active.secureUrl} target="_blank" rel="noopener noreferrer">
                    Ouvrir le fichier
                  </a>
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

