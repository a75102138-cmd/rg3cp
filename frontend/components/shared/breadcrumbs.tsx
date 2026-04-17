import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Fil d’Ariane"
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className
      )}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Accueil</span>
      </Link>
      {items.map((c, i) => (
        <Fragment key={`${c.label}-${i}`}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          {c.href && i < items.length - 1 ? (
            <Link href={c.href} className="hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span
              className={cn(
                i === items.length - 1 && "font-medium text-brand",
              )}
            >
              {c.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
