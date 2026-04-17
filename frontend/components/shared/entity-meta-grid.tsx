import { cn } from "@/lib/utils";

export type MetaItem = { label: string; value: React.ReactNode };

export function EntityMetaGrid({
  items,
  className,
}: {
  items: MetaItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-card/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
