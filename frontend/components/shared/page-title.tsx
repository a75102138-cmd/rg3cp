import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="mt-0 text-2xl font-semibold leading-tight tracking-tight text-brand md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
