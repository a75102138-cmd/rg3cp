"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { StickyPageToolbar } from "@/components/shared/sticky-page-toolbar";
import { DetailHeader } from "@/components/shared/detail-header";
import { ProjectCoverMedia } from "@/components/shared/project-cover-media";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { ZoneDetailTabs } from "./components/zone-detail-tabs";
import { ZoneEditModal } from "./components/zone-edit-modal";
import { ZoneDeleteDialog } from "./components/zone-delete-dialog";
import { useZoneDetail } from "./hooks/use-zone-detail";
import type { ZoneTab } from "./hooks/use-zone-detail";

export function ZoneDetailClient() {
  const {
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
  } = useZoneDetail();

  if (!id) return null;

  if (zoneQ.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (zoneQ.isError || !z || !project) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Zone introuvable ou erreur de chargement.
        <button type="button" className="mt-4 block font-medium underline" onClick={() => router.push("/zones")}>
          Retour aux zones
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StickyPageToolbar className="space-y-0 py-1.5">
        <Breadcrumbs
          items={[
            { label: "Projets", href: "/projects" },
            { label: project.name, href: `/projects/${project.id}` },
            { label: "Zones", href: "/zones" },
            { label: z.name },
          ]}
        />
      </StickyPageToolbar>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ZoneTab)}
        className="flex w-full flex-col gap-4"
      >
        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="relative h-56 w-full overflow-hidden rounded-t-2xl md:h-64">
              <ProjectCoverMedia imageUrl={z.imageUrl} alt={z.name} className="h-full w-full" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
            <div className="space-y-4 rounded-b-2xl p-6">
              <DetailHeader
                code={z.code}
                title={z.name}
                description={z.description ?? ""}
                actions={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setNameError(null);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </>
                }
              />
            </div>
          </div>
        </div>

        <ZoneDetailTabs activeTab={activeTab} setActiveTab={setActiveTab} zone={z} project={project} />
      </Tabs>

      <ZoneEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        code={z.code}
        projectName={project.name}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        nameError={nameError}
        setNameError={setNameError}
        isPending={updateMut.isPending}
        onSubmit={() => updateMut.mutate()}
      />

      <ZoneDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        zoneName={z.name}
        isPending={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
