"use client";

import { PageTitle } from "@/components/shared/page-title";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DetailHeaderProps = {
  code?: ReactNode;
  title: string;
  description?: string;
  badges?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DetailHeader({
  code,
  title,
  description,
  badges,
  meta,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <section className={cn("rounded-xl border bg-card/60 px-5 py-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          {code ? <p className="text-sm font-medium text-muted-foreground">{code}</p> : null}
          <PageTitle title={title} description={description} />
          {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
          {badges ? <div className="flex flex-wrap gap-2 pt-1">{badges}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
