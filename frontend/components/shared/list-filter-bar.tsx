"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ListFilterBarProps = {
  left?: ReactNode;
  filters?: ReactNode;
  search?: ReactNode;
  className?: string;
};

/**
 * Barre de filtres unifiée pour les pages liste.
 * - Les filtres sont dans une grille responsive (pas de chevauchement sur desktop).
 * - La recherche reste à droite sur grand écran, pleine largeur en dessous sur petit écran.
 */
export function ListFilterBar({ left, filters, search, className }: ListFilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {left ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">{left}</div>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-4 lg:gap-6",
          search && filters ? "lg:flex-row lg:items-start lg:justify-between" : "",
          search && !filters ? "lg:flex-row lg:justify-end" : "",
        )}
      >
        {filters ? (
          <div
            role="group"
            aria-label="Filtres"
            className={cn(
              "grid min-h-0 min-w-0 w-full gap-3",
              "grid-cols-1 sm:grid-cols-2",
              "lg:flex-1 lg:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] lg:content-start",
            )}
          >
            {filters}
          </div>
        ) : null}

        {search ? (
          <div className="w-full shrink-0 lg:w-[min(100%,22rem)] lg:max-w-md">{search}</div>
        ) : null}
      </div>
    </div>
  );
}
