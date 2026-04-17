"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import { mainNavEntries } from "@/lib/nav";
import { useProjectContext } from "@/providers/project-context";
import { navHref, isNavActive } from "@/components/layout/nav-helpers";
import { useAuth } from "@/providers/auth-provider";

const navLinkClass = cn(
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
);

export function AppSidebar() {
  const pathname = usePathname();
  const { projectId } = useProjectContext();
  const { user } = useAuth();
  const visibleNav = mainNavEntries.filter((item) => {
    if (user?.role === "ADMIN") {
      return ["/", "/projects", "/users", "/actors", "/settings"].includes(item.path);
    }
    if (item.path === "/users" || item.path === "/actors") return false;
    if (item.path === "/validation") return user?.role === "ACTEUR";
    return true;
  });

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-card/90 backdrop-blur-md lg:flex">
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-border/60 px-4">
        <BrandLogo size="md" priority />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3">
          <nav className="space-y-0.5 px-2" aria-label="Navigation principale">
            {visibleNav.map((item) => {
              const href = navHref(item, projectId);
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={item.path + item.title}
                  href={href}
                  className={cn(
                    navLinkClass,
                    active
                      ? "bg-primary/10 font-semibold text-brand ring-1 ring-inset ring-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title={
                    item.scope === "project" && !projectId
                      ? "Sélectionnez un projet dans l’en-tête — ouvrir la liste des projets"
                      : undefined
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
