"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand/brand-logo";
import { mainNavEntries } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useProjectContext } from "@/providers/project-context";
import { navHref, isNavActive } from "@/components/layout/nav-helpers";
import { useAuth } from "@/providers/auth-provider";

export function MobileNav() {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border/80 px-4 py-3 text-left">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white p-0.5 ring-1 ring-border/60">
              <BrandLogo size="sm" />
            </div>
            <div>
              <SheetTitle>Menu</SheetTitle>
              <p className="text-xs text-muted-foreground">G3C Patrimoine</p>
            </div>
          </div>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2" aria-label="Navigation principale">
          {visibleNav.map((item) => {
            const href = navHref(item, projectId);
            const active = isNavActive(pathname, item);
            return (
              <Link
                key={item.path + item.title}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-brand ring-1 ring-inset ring-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
