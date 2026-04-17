import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export type TimelineItem = {
  id: string;
  at: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
};

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-6 border-l border-border pl-6", className)}>
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute -left-[29px] mt-1 flex h-3 w-3 rounded-full border-2 border-background bg-bronze"
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-2">
            <time className="text-xs text-muted-foreground">
              {item.at.includes("T")
                ? formatDateTime(item.at)
                : formatDateTime(`${item.at}T12:00:00`)}
            </time>
            {item.badge}
          </div>
          <p className="mt-1 font-medium leading-snug">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
