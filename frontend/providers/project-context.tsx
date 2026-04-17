"use client";

import { projectsApi } from "@/lib/api/resources";
import type { ApiProject } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ProjectContextValue = {
  projectId: string;
  setProjectId: (id: string) => void;
  project: ApiProject | null;
  projects: ApiProject[];
  isProjectsListLoading: boolean;
  isProjectsListError: boolean;
  refetchProjects: () => void;
  /** @deprecated Utiliser isProjectsListLoading */
  isLoading: boolean;
  isError: boolean;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "patrimoine.selectedProjectId";

function readStoredProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const listQuery = useQuery({
    queryKey: ["projects", "list"],
    queryFn: () => projectsApi.list({ limit: 100, page: 1 }),
    retry: 2,
    staleTime: 30_000,
  });

  const projects = useMemo(
    () => listQuery.data?.data ?? [],
    [listQuery.data?.data],
  );

  const [projectId, setProjectIdState] = useState("");

  /** Id effectif tout de suite dès que la liste est là (pas d’attendre useEffect) */
  const effectiveProjectId = useMemo(() => {
    if (!projects.length) return "";
    if (projectId && projects.some((p) => p.id === projectId)) return projectId;
    const stored = typeof window !== "undefined" ? readStoredProjectId() : null;
    if (stored && projects.some((p) => p.id === stored)) return stored;
    return projects[0]!.id;
  }, [projects, projectId]);

  useEffect(() => {
    if (!effectiveProjectId) {
      if (projectId) setProjectIdState("");
      return;
    }
    if (effectiveProjectId === projectId) return;
    setProjectIdState(effectiveProjectId);
    try {
      localStorage.setItem(STORAGE_KEY, effectiveProjectId);
    } catch {
      /* ignore */
    }
  }, [effectiveProjectId, projectId]);

  const detailQuery = useQuery({
    queryKey: ["projects", "detail", effectiveProjectId],
    queryFn: () => projectsApi.get(effectiveProjectId),
    enabled: Boolean(effectiveProjectId),
    retry: 1,
  });

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const project = useMemo(() => {
    if (detailQuery.data) return detailQuery.data;
    if (!effectiveProjectId) return null;
    return (
      projects.find((p) => p.id === effectiveProjectId) ?? projects[0] ?? null
    );
  }, [detailQuery.data, projects, effectiveProjectId]);

  const value = useMemo(
    () => ({
      projectId: effectiveProjectId,
      setProjectId,
      project,
      projects,
      isProjectsListLoading: listQuery.isPending || listQuery.isFetching,
      isProjectsListError: listQuery.isError,
      refetchProjects: () => void listQuery.refetch(),
      isLoading:
        listQuery.isPending ||
        listQuery.isFetching ||
        (!!effectiveProjectId && detailQuery.isPending),
      isError: listQuery.isError || detailQuery.isError,
    }),
    [
      project,
      projects,
      effectiveProjectId,
      setProjectId,
      listQuery.isPending,
      listQuery.isFetching,
      listQuery.isError,
      listQuery.refetch,
      detailQuery.isPending,
      detailQuery.isError,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }
  return ctx;
}
