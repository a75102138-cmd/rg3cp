import { cn } from "@/lib/utils";

/**
 * Coquille sticky dans la zone scroll du `<main>` (sous l’en-tête app).
 *
 * **Composition par page** : ce composant n’impose rien d’autre que le positionnement.
 * - Pages **projet** et **zone** : n’y mettre que le **fil d’Ariane** ; les **onglets**
 *   restent **en dehors**, sous le bloc héro / détail (voir `project-detail-client`,
 *   `zone-detail-client`).
 * - Ne pas y placer les `TabsList` : cela recrée le problème d’onglets « collés » en haut.
 */
export const stickyPageToolbarClass =
  "sticky top-0 z-20 -mx-4 border-b border-border/70 bg-background/95 px-4 py-2 shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-background/90 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8";

type StickyPageToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

export function StickyPageToolbar({ children, className }: StickyPageToolbarProps) {
  return <div className={cn(stickyPageToolbarClass, "space-y-3", className)}>{children}</div>;
}
