import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export function DoctrinalBlock({
  principle,
  className,
}: {
  principle: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-l-4 border-bronze/60 bg-bronze/5 px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex gap-2">
        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-bronze">
            Principe doctrinal
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {principle}
          </p>
        </div>
      </div>
    </div>
  );
}
