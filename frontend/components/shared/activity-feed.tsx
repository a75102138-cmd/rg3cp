"use client";

import { formatDateTime } from "@/lib/format";
import Link from "next/link";

export type ActivityFeedItem = {
  id: string;
  at: string;
  label: string;
  type: string;
  href?: string;
};

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Aucune activité récente.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="flex gap-3 border-b border-border/60 pb-3 last:border-0"
        >
          <div className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(it.at)}
          </div>
          <div className="min-w-0">
            {it.href ? (
              <Link href={it.href} className="text-sm font-medium hover:underline">
                {it.label}
              </Link>
            ) : (
              <p className="text-sm font-medium">{it.label}</p>
            )}
            <p className="text-xs capitalize text-muted-foreground">{it.type}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
