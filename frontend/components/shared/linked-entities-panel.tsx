import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkedEntity = {
  href: string;
  label: string;
  meta?: string;
};

export function LinkedEntitiesPanel({
  title = "Enregistrements liés",
  items,
  className,
}: {
  title?: string;
  items: LinkedEntity[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
            >
              <span>
                <span className="font-medium text-foreground">{item.label}</span>
                {item.meta ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.meta}
                  </span>
                ) : null}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
