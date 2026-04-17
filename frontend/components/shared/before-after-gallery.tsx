import { cn } from "@/lib/utils";
import type { Media } from "@/types/domain";
import Image from "next/image";

export function BeforeAfterGallery({
  before,
  after,
  className,
}: {
  before: Media | null;
  after: Media | null;
  className?: string;
}) {
  if (!before && !after) return null;
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Avant
        </p>
        {before ? (
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
            <Image
              src={before.url}
              alt={before.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Aucun média
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Après
        </p>
        {after ? (
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
            <Image
              src={after.url}
              alt={after.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Aucun média
          </div>
        )}
      </div>
    </div>
  );
}
