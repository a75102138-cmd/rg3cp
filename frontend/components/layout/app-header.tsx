"use client";

import { ProjectSelect } from "@/components/layout/project-select";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Bell, Command, LogOut, User } from "lucide-react";

function ProjectSelectFallback() {
  return <div className="h-9 w-[220px] animate-pulse rounded-md border border-dashed bg-muted/40" />;
}

export function AppHeader() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/documents?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md">
      <MobileNav />
      <form onSubmit={onSearchSubmit} className="hidden max-w-md flex-1 md:block">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Recherche transversale (redirige vers documents)…"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={<ProjectSelectFallback />}>
          <ProjectSelect />
        </Suspense>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-[200px] truncate" type="button">
              <User className="mr-1.5 h-4 w-4 shrink-0" />
              <span className="truncate">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Rôle : {user?.role ?? "—"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" className="hidden sm:inline-flex" type="button" title="Raccourcis">
          <Command className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" type="button" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
