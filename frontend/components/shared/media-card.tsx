import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Media } from "@/types/domain";
import Image from "next/image";
import { Camera, Scan, Plane, Map } from "lucide-react";

const typeIcon = {
  photo: Camera,
  scan: Scan,
  drone: Plane,
  plan: Map,
};

export function MediaCard({
  media,
  className,
}: {
  media: Media;
  className?: string;
}) {
  const Icon = typeIcon[media.type];
  return (
    <figure
      className={cn(
        "group overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={media.url}
          alt={media.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Icon className="h-3 w-3" />
            {media.type}
          </Badge>
          {media.beforeAfterGroup ? (
            <Badge variant="outline" className="text-[10px] capitalize">
              {media.beforeAfterGroup}
            </Badge>
          ) : null}
        </div>
      </div>
      <figcaption className="space-y-1 p-3">
        <p className="text-sm font-medium leading-snug">{media.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(media.date)} · {media.photographer}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {media.tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
