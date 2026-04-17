"use client";

import { useAuth } from "@/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Attend le chargement du profil ; si cookie invalide, redirection client vers /login.
 */
export function PlatformAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const q = pathname ? `?from=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${q}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Chargement du compte…</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
