"use client";

import { usePathname } from "next/navigation";

/**
 * Identifiant projet depuis l’URL `/projects/[id]` (y compris sous-routes).
 * À utiliser pour préremplir les créations depuis une page projet.
 */
export function useResolvedProjectId(): string | undefined {
  const pathname = usePathname();
  const m = pathname?.match(/^\/projects\/([^/]+)/);
  return m?.[1];
}

/**
 * Identifiant zone depuis l’URL `/zones/[id]`.
 * À utiliser pour préremplir les créations depuis une page zone.
 */
export function useResolvedZoneId(): string | undefined {
  const pathname = usePathname();
  const m = pathname?.match(/^\/zones\/([^/]+)/);
  return m?.[1];
}
