"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type RelatedSectionToolbarProps = {
  title?: string;
  action?: ReactNode;
  className?: string;
};

export function RelatedSectionToolbar({ title, action, className }: RelatedSectionToolbarProps) {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
      {action ? <div className="ml-auto flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
