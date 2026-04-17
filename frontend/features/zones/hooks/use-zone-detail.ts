"use client";

import { zonesApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess, TOAST_MSG } from "@/lib/toast-feedback";
import { useProjectContext } from "@/providers/project-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const ZONE_TABS = ["media", "risks"] as const;
export type ZoneTab = (typeof ZONE_TABS)[number];

function isZoneTab(v: string | null): v is ZoneTab {
  return v != null && (ZONE_TABS as readonly string[]).includes(v);
}

export function useZoneDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ZoneTab>(() => (isZoneTab(tabFromUrl) ? tabFromUrl : "media"));
  useEffect(() => {
    const t = searchParams.get("tab");
    if (isZoneTab(t)) setActiveTab(t);
  }, [searchParams]);

  const zoneQ = useQuery({
    queryKey: ["zone", id],
    queryFn: () => zonesApi.get(id),
    enabled: Boolean(id),
  });

  const z = zoneQ.data;
  const project = z?.project;
  const { setProjectId, projectId: contextProjectId } = useProjectContext();
  useEffect(() => {
    if (z?.projectId && z.projectId !== contextProjectId) setProjectId(z.projectId);
  }, [z?.projectId, contextProjectId, setProjectId]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!z) return;
    setName(z.name);
    setDescription(z.description ?? "");
  }, [z?.id, z?.name, z?.description]);

  const updateMut = useMutation({
    mutationFn: () =>
      zonesApi.update(id, {
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async () => {
      toastSuccess("Zone enregistrée avec succès.");
      setEditOpen(false);
      setNameError(null);
      await queryClient.invalidateQueries({ queryKey: ["zone", id] });
      await queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
    onError: (e) => toastMutationError(e),
  });

  const deleteMut = useMutation({
    mutationFn: () => zonesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["zones"] });
      if (project?.id) router.push(`/projects/${project.id}?tab=zones`);
      else router.push("/zones");
    },
    onError: (e) => toastMutationError(e, TOAST_MSG.deleteFailed),
  });

  return {
    id,
    router,
    zoneQ,
    z,
    project,
    activeTab,
    setActiveTab,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    name,
    setName,
    description,
    setDescription,
    nameError,
    setNameError,
    updateMut,
    deleteMut,
  };
}

