"use client";

import { cn } from "@/lib/utils";
import type { Zone } from "@/types/domain";
import { ChevronDown, ChevronRight, MapPinned } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HeritageSensitivityBadge } from "./heritage-sensitivity-badge";
import { StatusBadge } from "./status-badge";

function ZoneTreeNode({
  zone,
  childrenByParent,
  depth,
}: {
  zone: Zone;
  childrenByParent: Map<string | null, Zone[]>;
  depth: number;
}) {
  const children = childrenByParent.get(zone.id) ?? [];
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = children.length > 0;

  return (
    <li className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg py-1.5 pr-2 hover:bg-muted/60",
          depth > 0 && "pl-2"
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded p-0.5 hover:bg-muted"
            aria-expanded={open}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <MapPinned className="h-4 w-4 text-muted-foreground" />
        <Link
          href={`/zones/${zone.id}`}
          className="min-w-0 flex-1 font-medium text-foreground hover:underline"
        >
          <span className="truncate">{zone.name}</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {zone.code}
          </span>
        </Link>
        <HeritageSensitivityBadge value={zone.heritageSensitivity} />
        <StatusBadge status={zone.status} />
      </div>
      {hasChildren && open ? (
        <ul className="ml-1 border-l border-border/80 pl-1">
          {children.map((c) => (
            <ZoneTreeNode
              key={c.id}
              zone={c}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ZoneTree({
  zones,
  projectId,
  className,
}: {
  zones: Zone[];
  projectId: string;
  className?: string;
}) {
  const filtered = zones.filter((z) => z.projectId === projectId);
  const childrenByParent = new Map<string | null, Zone[]>();
  for (const z of filtered) {
    const key = z.parentZoneId;
    const list = childrenByParent.get(key) ?? [];
    list.push(z);
    childrenByParent.set(key, list);
  }
  const roots = childrenByParent.get(null) ?? [];

  return (
    <ul className={cn("space-y-0.5", className)}>
      {roots.map((z) => (
        <ZoneTreeNode
          key={z.id}
          zone={z}
          childrenByParent={childrenByParent}
          depth={0}
        />
      ))}
    </ul>
  );
}
