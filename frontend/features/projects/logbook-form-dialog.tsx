"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { MultiSelectPopover } from "@/components/shared/multi-select-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { interventionTypeLabel } from "@/lib/labels/intervention-type";
import { WEATHER_OPTIONS } from "@/lib/labels/weather-fr";
import { logbooksApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess } from "@/lib/toast-feedback";
import type { ApiDecision, ApiIntervention } from "@/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

function toDatetimeLocalValue(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string): string {
  const d = new Date(local);
  return d.toISOString();
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  decisions: ApiDecision[];
  interventions: ApiIntervention[];
  editingId: string | null;
  onSuccess: () => void;
};

export function LogbookFormDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  decisions,
  interventions,
  editingId,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [eventAtLocal, setEventAtLocal] = useState("");
  const [workforce, setWorkforce] = useState("");
  const [weather, setWeather] = useState("");
  const [decisionIds, setDecisionIds] = useState<Set<string>>(new Set());
  const [interventionIds, setInterventionIds] = useState<Set<string>>(new Set());
  const [titleError, setTitleError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [workforceError, setWorkforceError] = useState<string | null>(null);

  const detailQ = useQuery({
    queryKey: ["logbook", editingId],
    queryFn: () => logbooksApi.get(editingId!),
    enabled: open && Boolean(editingId),
  });
  useEffect(() => {
    if (!open) return;
    setTitleError(null);
    setEventError(null);
    setWorkforceError(null);
    if (!editingId) {
      setTitle("");
      setDescription("");
      setAuthorName("");
      setEventAtLocal(toDatetimeLocalValue(new Date().toISOString()));
      setWorkforce("");
      setWeather("");
      setDecisionIds(new Set());
      setInterventionIds(new Set());
      return;
    }
    const d = detailQ.data;
    if (!d) return;
    setTitle(d.title ?? "");
    setDescription(d.description ?? "");
    setAuthorName(
      (d.authorName?.trim() || d.authorActor?.name || "").trim(),
    );
    setEventAtLocal(toDatetimeLocalValue(d.eventAt));
    setWorkforce(d.workforce != null ? String(d.workforce) : "");
    setWeather(d.weather ?? "");
    setDecisionIds(new Set(d.decisionLinks?.map((l) => l.decision.id) ?? []));
    setInterventionIds(new Set(d.interventionLinks?.map((l) => l.intervention.id) ?? []));
  }, [open, editingId, detailQ.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const wf = workforce.trim();
      let workforceNum: number | undefined;
      if (wf !== "") {
        workforceNum = parseInt(wf, 10);
      }
      const dec = Array.from(decisionIds);
      const ints = Array.from(interventionIds);
      const payloadBase = {
        description: description.trim() || undefined,
        authorName: authorName.trim() || undefined,
        workforce: wf === "" ? undefined : workforceNum,
        weather: weather === "" ? undefined : weather,
        decisionIds: dec,
        interventionIds: ints,
      };

      if (editingId) {
        await logbooksApi.update(editingId, {
          ...payloadBase,
          title: title.trim(),
          eventAt: fromDatetimeLocalValue(eventAtLocal),
        });
        return;
      }

      await logbooksApi.create({
        projectId,
        title: title.trim(),
        eventAt: fromDatetimeLocalValue(eventAtLocal),
        ...payloadBase,
      });
    },
    onSuccess: () => {
      toastSuccess(
        editingId
          ? "Entrée de journal enregistrée avec succès."
          : "Entrée de journal créée avec succès.",
      );
      onSuccess();
      onOpenChange(false);
    },
    onError: (e: unknown) => toastMutationError(e),
  });

  const toggle = (set: Dispatch<SetStateAction<Set<string>>>, id: string) => {
    set((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const isLoadingDetail = Boolean(editingId) && detailQ.isLoading;
  const logbookFormId = "logbook-entry-form";

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={editingId ? "Modifier l’entrée" : "Nouvelle entrée de journal"}
      description={
        <p>
          <span className="font-medium text-foreground">Projet :</span> {projectName}
        </p>
      }
      size="lg"
      bodyClassName="px-5 py-4"
      footer={
        isLoadingDetail ? null : (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={logbookFormId} size="sm" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Enregistrement…
                </>
              ) : editingId ? (
                "Enregistrer"
              ) : (
                "Créer l’entrée"
              )}
            </Button>
          </>
        )
      }
    >
      {isLoadingDetail ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          id={logbookFormId}
          className="flex flex-col"
          onSubmit={(ev) => {
            ev.preventDefault();
            setTitleError(null);
            setEventError(null);
            setWorkforceError(null);
            const t = title.trim();
            if (!t) {
              setTitleError("Le titre est obligatoire.");
              return;
            }
            if (!eventAtLocal.trim()) {
              setEventError("La date et l’heure de l’événement sont obligatoires.");
              return;
            }
            const d = new Date(eventAtLocal);
            if (Number.isNaN(d.getTime())) {
              setEventError("Date ou heure invalides.");
              return;
            }
            const wf = workforce.trim();
            if (wf !== "") {
              const n = parseInt(wf, 10);
              if (Number.isNaN(n) || n < 0) {
                setWorkforceError("Effectif invalide.");
                return;
              }
            }
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="lb-title" className="text-xs font-medium">
                Titre *
              </Label>
              <Input
                id="lb-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                className="h-9"
                placeholder="Ex. Visite conservateur, compte rendu de chantier…"
                aria-invalid={Boolean(titleError)}
              />
              {titleError ? <p className="text-xs text-destructive">{titleError}</p> : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lb-event" className="text-xs font-medium">
                Date et heure de l’événement *
              </Label>
              <Input
                id="lb-event"
                type="datetime-local"
                value={eventAtLocal}
                onChange={(e) => {
                  setEventAtLocal(e.target.value);
                  if (eventError) setEventError(null);
                }}
                className="h-9"
                aria-invalid={Boolean(eventError)}
              />
              {eventError ? <p className="text-xs text-destructive">{eventError}</p> : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lb-desc" className="text-xs font-medium">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </Label>
              <Textarea
                id="lb-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[88px] resize-y text-sm"
                placeholder="Compte rendu, observations, suite à donner…"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="lb-author" className="text-xs font-medium">
                Auteur / rédacteur{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="lb-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-9"
                placeholder="Nom ou fonction…"
                maxLength={255}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lb-wf" className="text-xs font-medium">
                  Effectif{" "}
                  <span className="font-normal text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  id="lb-wf"
                  type="number"
                  min={0}
                  value={workforce}
                  onChange={(e) => {
                    setWorkforce(e.target.value);
                    if (workforceError) setWorkforceError(null);
                  }}
                  className="h-9"
                  placeholder="—"
                  aria-invalid={Boolean(workforceError)}
                />
                {workforceError ? (
                  <p className="text-xs text-destructive">{workforceError}</p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Météo{" "}
                  <span className="font-normal text-muted-foreground">(optionnel)</span>
                </Label>
                <Select
                  value={weather || "__none__"}
                  onValueChange={(v) => setWeather(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non renseigné</SelectItem>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-medium text-foreground">Liens optionnels</p>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  Décisions liées
                </p>
                <MultiSelectPopover
                  items={decisions.map((d) => ({ id: d.id, label: d.title }))}
                  selected={decisionIds}
                  onToggle={(id) => toggle(setDecisionIds, id)}
                  placeholder="Décisions (optionnel)"
                  emptyMessage="Aucune décision sur ce projet (créez des zones et des décisions si besoin)."
                  summary={(n) =>
                    n === 1 ? "1 décision sélectionnée" : `${n} décisions sélectionnées`
                  }
                  disabled={!decisions.length}
                />
              </div>

              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  Interventions liées
                </p>
                <MultiSelectPopover
                  items={interventions.map((i) => ({
                    id: i.id,
                    label: `${i.code} — ${interventionTypeLabel(i.interventionType)}`,
                  }))}
                  selected={interventionIds}
                  onToggle={(id) => toggle(setInterventionIds, id)}
                  placeholder="Interventions (optionnel)"
                  emptyMessage="Aucune intervention sur ce projet."
                  summary={(n) =>
                    n === 1 ? "1 intervention sélectionnée" : `${n} interventions sélectionnées`
                  }
                  disabled={!interventions.length}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </EntityFormModal>
  );
}
