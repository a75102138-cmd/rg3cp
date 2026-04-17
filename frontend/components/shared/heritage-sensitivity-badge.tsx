import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HeritageSensitivity } from "@/types/domain";

const map: Record<
  HeritageSensitivity,
  { className: string; label: string }
> = {
  low: { className: "bg-stone-50 text-stone-700 border-stone-200", label: "Faible" },
  medium: { className: "bg-amber-50/80 text-amber-950 border-amber-200", label: "Moyenne" },
  high: { className: "bg-orange-50 text-orange-950 border-orange-200", label: "Élevée" },
  critical: { className: "bg-bronze/15 text-bronze border-bronze/30", label: "Critique" },
};

function parseHeritage(
  v: HeritageSensitivity | string | null | undefined,
): HeritageSensitivity | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string") return v;
  const k = v.toLowerCase();
  if (k === "low") return "low";
  if (k === "medium") return "medium";
  if (k === "high") return "high";
  if (k === "critical") return "critical";
  if (k === "exceptional") return "critical";
  return null;
}

export function HeritageSensitivityBadge({
  value,
  className,
}: {
  value: HeritageSensitivity | string | null | undefined;
  className?: string;
}) {
  const parsed = parseHeritage(value);
  if (!parsed) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-normal border-dashed text-muted-foreground",
          className,
        )}
      >
        Non renseignée
      </Badge>
    );
  }
  const m = map[parsed];
  return (
    <Badge variant="outline" className={cn("font-normal", m.className, className)}>
      {m.label}
    </Badge>
  );
}
