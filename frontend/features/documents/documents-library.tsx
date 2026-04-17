"use client";

import { ListFilterBar } from "@/components/shared/list-filter-bar";
import { PageTitle } from "@/components/shared/page-title";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { DocumentsLibraryFilters } from "./components/documents-library-filters";
import { DocumentsLibraryGrid } from "./components/documents-library-grid";
import { DocumentPreviewSheet } from "./components/document-preview-sheet";
import { useDocumentsLibraryData } from "./hooks/use-documents-library";

export function DocumentsLibrary() {
  const {
    projectId,
    q,
    setQ,
    fileKind,
    setFileKind,
    zoneId,
    setZoneId,
    ctx,
    setCtx,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    datePreset,
    setDatePreset,
    open,
    setOpen,
    setActiveId,
    docsQ,
    zonesQ,
    zones,
    zoneById,
    fileKinds,
    filtered,
    active,
  } = useDocumentsLibraryData();

  if (!projectId) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Bibliothèque documentaire"
          description="Sélectionnez un projet pour afficher ses documents."
        />
        <p className="text-sm text-muted-foreground">Aucun projet sélectionné.</p>
      </div>
    );
  }

  if (docsQ.isError) {
    return (
      <div className="space-y-6">
        <PageTitle title="Bibliothèque documentaire" description="" />
        <p className="text-sm text-destructive">Impossible de charger les documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Bibliothèque documentaire"
        description="Plans, rapports, PV et livrables — filtrés par type, zone et rattachement."
      />
      <DocumentsLibraryFilters
        fileKind={fileKind}
        setFileKind={setFileKind}
        fileKinds={fileKinds}
        zoneId={zoneId}
        setZoneId={setZoneId}
        zones={zones}
        ctx={ctx}
        setCtx={setCtx}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        q={q}
        setQ={setQ}
      />

      <DocumentsLibraryGrid
        loading={docsQ.isLoading || zonesQ.isLoading}
        filtered={filtered}
        zoneById={zoneById}
        onOpen={(id) => {
          setActiveId(id);
          setOpen(true);
        }}
      />

      <DocumentPreviewSheet open={open} onOpenChange={setOpen} active={active} />
    </div>
  );
}
