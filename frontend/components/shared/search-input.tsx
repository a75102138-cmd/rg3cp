"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Texte normalisé pour comparaison de recherche (casse + accents). */
export function normalizeSearchText(s: string): string {
  return stripDiacritics(s).toLowerCase().trim();
}

/**
 * Découpe la requête en mots ; chaîne vide = tout correspond.
 * Chaque mot doit apparaître dans le texte cible (ET logique).
 */
export function textMatchesSearchTokens(haystackNormalized: string, rawQuery: string): boolean {
  const q = rawQuery.trim();
  if (!q) return true;
  const tokens = q
    .split(/\s+/)
    .map(normalizeSearchText)
    .filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every((t) => haystackNormalized.includes(t));
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className,
  clearLabel = "Effacer la recherche",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessibilité du bouton effacer (si valeur non vide). */
  clearLabel?: string;
}) {
  const showClear = value.length > 0;

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-9", showClear ? "pr-9" : undefined)}
        aria-label="Recherche"
      />
      {showClear ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={clearLabel}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
