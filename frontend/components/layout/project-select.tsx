"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectContext } from "@/providers/project-context";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

const PROJECT_DETAIL_PATH = /^\/projects\/([^/]+)$/;
const PROJECT_SCOPED_PATH = /^\/projects\/([^/]+)\/([^/]+)$/;
const ZONE_DETAIL_PATH = /^\/zones\/([^/]+)$/;

function truncateName(name: string, max = 36) {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function ProjectSelect() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    projectId,
    setProjectId,
    project,
    projects,
    isProjectsListLoading,
    isProjectsListError,
    refetchProjects,
  } = useProjectContext();

  const selected = useMemo(() => {
    if (project) return project;
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId) ?? null;
  }, [project, projectId, projects]);

  const displayCode = selected?.code ?? (isProjectsListLoading ? "…" : "—");
  const displayName = selected?.name
    ? truncateName(selected.name)
    : isProjectsListLoading
      ? "Chargement…"
      : "Choisir un projet";

  const navigateAfterSelect = useCallback(
    (newId: string) => {
      const scopedMatch = PROJECT_SCOPED_PATH.exec(pathname);
      if (scopedMatch) {
        const currentId = scopedMatch[1];
        const section = scopedMatch[2];
        if (currentId !== newId) {
          router.push(`/projects/${newId}/${section}`);
        }
        return;
      }
      const projectMatch = PROJECT_DETAIL_PATH.exec(pathname);
      if (projectMatch) {
        const currentId = projectMatch[1];
        if (currentId !== newId) {
          router.push(`/projects/${newId}`);
        }
        return;
      }
      if (ZONE_DETAIL_PATH.test(pathname)) {
        router.push(`/projects/${newId}/zones`);
        return;
      }
      const sectionMap: Record<string, string> = {
        "/zones": "zones",
        "/media": "media",
        "/documents": "documents",
        "/journal": "journal",
        "/risks": "risques",
        "/lab-tests": "essais",
      };
      const section = sectionMap[pathname];
      if (section) {
        router.push(`/projects/${newId}/${section}`);
        return;
      }
      router.push(`/projects/${newId}`);
    },
    [pathname, router],
  );

  const handleSelect = useCallback(
    (newId: string) => {
      if (!newId || newId === projectId) {
        setOpen(false);
        return;
      }
      setProjectId(newId);
      setOpen(false);
      navigateAfterSelect(newId);
    },
    [navigateAfterSelect, projectId, setProjectId],
  );

  if (isProjectsListLoading && !projects.length) {
    return (
      <div className="h-9 w-[220px] animate-pulse rounded-md border border-dashed bg-muted/40" />
    );
  }

  if (isProjectsListError) {
    return (
      <div className="flex h-9 max-w-[280px] items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
        <span className="truncate text-xs text-destructive">Projets inaccessibles</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs"
          onClick={() => refetchProjects()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "h-9 w-[min(100vw-8rem,280px)] justify-between gap-2 border-dashed bg-background/80 px-3 text-left font-normal shadow-sm",
            "hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring",
            "sm:min-w-[240px] sm:w-[260px]",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
            <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
              {displayCode}
            </span>
            <span className="truncate text-sm text-muted-foreground sm:text-foreground">
              {displayName}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(22rem,var(--radix-dropdown-menu-content-available-height))] w-[min(calc(100vw-2rem),320px)] overflow-y-auto sm:w-[280px]"
        sideOffset={6}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Projets disponibles
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!projects.length ? (
          <DropdownMenuItem disabled className="cursor-default text-muted-foreground focus:bg-transparent">
            Aucun projet disponible
          </DropdownMenuItem>
        ) : (
          <DropdownMenuRadioGroup value={projectId} onValueChange={handleSelect}>
            {projects.map((p) => (
              <DropdownMenuRadioItem
                key={p.id}
                value={p.id}
                className="cursor-pointer py-2 pl-8 pr-2"
              >
                <span className="flex w-full min-w-0 flex-col gap-0.5 text-left">
                  <span className="font-mono text-xs font-semibold tabular-nums">{p.code}</span>
                  <span className="truncate text-sm leading-snug">{p.name}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
