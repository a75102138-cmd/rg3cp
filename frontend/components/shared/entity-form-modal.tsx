"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type EntityFormModalSize = "sm" | "md" | "lg";

const sizeWidthClass: Record<EntityFormModalSize, string> = {
  sm: "w-[min(28rem,calc(100vw-2rem))] max-w-md",
  md: "w-[min(32rem,calc(100vw-2rem))] max-w-lg",
  lg: "w-[min(40rem,calc(100vw-2rem))] max-w-2xl",
};

function ModalIntro({ children }: { children: ReactNode }) {
  if (children == null) return null;
  if (typeof children === "string" || typeof children === "number") {
    return <DialogDescription className="text-left">{children}</DialogDescription>;
  }
  return <div className="space-y-1 text-left text-sm text-muted-foreground">{children}</div>;
}

export type EntityFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Texte ou bloc sous le titre (accessibilité : préférer une phrase courte si possible) */
  description?: ReactNode;
  size?: EntityFormModalSize;
  /**
   * Formulaires longs : en-tête fixe, corps scrollable, pied fixe.
   * Formulaires courts / confirmations : mise en page type dialogue standard.
   */
  variant?: "form" | "simple";
  children: ReactNode;
  footer?: ReactNode;
  /** Zone standardisée pour les erreurs / chargement sous le formulaire */
  statusArea?: ReactNode;
  className?: string;
  /** Classes sur le conteneur scrollable (variant form) ou le bloc corps (simple) */
  bodyClassName?: string;
};

/**
 * Coquille modale unique pour création / édition d’entités.
 * - variant `form` : hauteur max ~88vh, scroll interne, pied aligné.
 * - variant `simple` : dialogue compact (pas de grille scroll forcée).
 *
 * Si le pied est hors du `<form>`, utiliser `type="submit" form="mon-id"` sur le bouton principal.
 */
export function EntityFormModal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  variant = "form",
  children,
  footer,
  statusArea,
  className,
  bodyClassName,
}: EntityFormModalProps) {
  const width = sizeWidthClass[size];
  const showFooter = footer != null;

  if (variant === "simple") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(width, "flex flex-col gap-4", className)}>
          <DialogHeader className="space-y-2 pr-12 text-left sm:text-left">
            <DialogTitle>{title}</DialogTitle>
            <ModalIntro>{description}</ModalIntro>
          </DialogHeader>
          <div className={cn(bodyClassName)}>{children}</div>
          {showFooter ? <DialogFooter className="gap-2 sm:gap-0">{footer}</DialogFooter> : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          width,
          "grid min-h-0 max-h-[min(88vh,calc(100dvh-2rem))] gap-0 overflow-hidden p-0",
          showFooter
            ? "grid-rows-[auto_minmax(0,1fr)_auto]"
            : "grid-rows-[auto_minmax(0,1fr)]",
          className,
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/80 px-6 pb-4 pt-6 text-left sm:text-left pr-14">
          <DialogTitle>{title}</DialogTitle>
          <ModalIntro>{description}</ModalIntro>
        </DialogHeader>
        <div
          className={cn(
            "min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable] px-6 py-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {showFooter ? (
          <div className="shrink-0 border-t border-border/80 bg-background px-6 py-4">
            {statusArea ? <div className="mb-3 text-sm text-muted-foreground">{statusArea}</div> : null}
            <DialogFooter className="gap-2 sm:gap-0">{footer}</DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Alias explicite pour les équipes qui préfèrent le nom « AppModal ». */
export const AppModal = EntityFormModal;
