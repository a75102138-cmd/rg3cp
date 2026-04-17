import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { Document } from "@/types/domain";
import { FileText } from "lucide-react";

export function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Card className="rounded-xl shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-base leading-snug">{doc.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {doc.type} · {doc.fileType} · {doc.size}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{doc.description || "—"}</p>
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] font-normal">
              {t}
            </Badge>
          ))}
        </div>
        <p className="text-xs">
          v{doc.version} · {doc.uploadedBy} ·{" "}
          {formatDateTime(doc.uploadedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
