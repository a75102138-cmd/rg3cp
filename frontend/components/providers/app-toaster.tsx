"use client";

import { Toaster } from "sonner";

/** Toasts globaux (coin supérieur droit, auto-fermeture, style aligné à l’app). */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4500}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group border border-border/80 bg-card text-foreground shadow-md backdrop-blur-sm",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          success: "border-emerald-200/80",
          error: "border-destructive/30",
        },
      }}
    />
  );
}
