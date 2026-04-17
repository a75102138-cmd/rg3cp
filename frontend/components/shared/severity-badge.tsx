import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/domain";

const map: Record<
  Severity,
  { className: string; label: string }
> = {
  info: {
    className: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Information",
  },
  low: {
    className: "bg-emerald-50 text-emerald-900 border-emerald-200",
    label: "Faible",
  },
  medium: {
    className: "bg-amber-50 text-amber-900 border-amber-200",
    label: "Moyen",
  },
  high: {
    className: "bg-orange-50 text-orange-900 border-orange-200",
    label: "Élevé",
  },
  critical: {
    className: "bg-red-50 text-red-900 border-red-200",
    label: "Critique",
  },
};

function normalizeSeverity(s: Severity | string): Severity {
  if (typeof s !== "string") return s;
  const k = s.toLowerCase();
  if (k === "low") return "low";
  if (k === "medium") return "medium";
  if (k === "high") return "high";
  if (k === "critical") return "critical";
  if (k === "info") return "info";
  return "info";
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity | string;
  className?: string;
}) {
  const m = map[normalizeSeverity(severity)];
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", m.className, className)}
    >
      {m.label}
    </Badge>
  );
}
