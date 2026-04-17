"use client";

import { Button } from "@/components/ui/button";
import { MultiSelectPopover } from "@/components/shared/multi-select-popover";
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
import {
  decisionsApi,
  fetchAllPages,
  observationsApi,
  pathologiesApi,
  zonesApi,
} from "@/lib/api/resources";
import { DOCTRINAL_PRINCIPLES_OPTIONS } from "@/lib/labels/doctrinal-principles-fr";
import { decisionSchema, type DecisionFormValues } from "@/lib/schemas/decision";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProjectContext } from "@/providers/project-context";
import { toastSuccess } from "@/lib/toast-feedback";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const DEC_TYPES = [
  "CONSERVATION_APPROACH",
  "INTERVENTION_PRINCIPLE",
  "MATERIAL_CHOICE",
  "METHODOLOGY",
  "PHASING",
  "MONITORING",
  "REGULATORY",
  "OTHER",
] as const;
const STATUS_MAP: Record<DecisionFormValues["validationStatus"], string> = {
  draft: "DRAFT",
  under_review: "PROPOSED",
  validated: "APPROVED",
  rejected: "CANCELLED",
};

export function DecisionForm({
  defaultValues,
  decisionId,
}: {
  defaultValues?: Partial<DecisionFormValues>;
  decisionId?: string;
}) {
  const { projectId } = useProjectContext();
  const zonesQ = useQuery({
    queryKey: ["zones", "form", projectId],
    queryFn: () => fetchAllPages((page) => zonesApi.list({ page, limit: 100, projectId })),
    enabled: Boolean(projectId),
  });
  const obsQ = useQuery({
    queryKey: ["observations", "form"],
    queryFn: () => fetchAllPages((page) => observationsApi.list({ page, limit: 200 })),
  });
  const pathQ = useQuery({
    queryKey: ["pathologies", "form"],
    queryFn: () => fetchAllPages((page) => pathologiesApi.list({ page, limit: 200 })),
  });
  const zList = zonesQ.data ?? [];
  const zoneIds = new Set(zList.map((z) => z.id));
  const obs = useMemo(() => (obsQ.data ?? []).filter((o) => zoneIds.has(o.zoneId)), [obsQ.data, zoneIds]);
  const pths = useMemo(() => (pathQ.data ?? []).filter((p) => zoneIds.has(p.zoneId)), [pathQ.data, zoneIds]);
  const [principles, setPrinciples] = useState<Set<string>>(new Set(defaultValues?.doctrinalPrinciples ?? []));

  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      title: "",
      decisionType: "CONSERVATION_APPROACH",
      doctrinalPrinciples: [],
      justification: "",
      zoneId: zList[0]?.id ?? "",
      observationId: obs[0]?.id ?? "",
      pathologyId: "",
      validationStatus: "draft",
      decidedBy: "",
      decisionDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const saveMut = useMutation({
    mutationFn: (values: DecisionFormValues) => {
      const body = {
        zoneId: values.zoneId,
        observationId: values.observationId,
        pathologyId: values.pathologyId || undefined,
        title: values.title,
        decisionType: values.decisionType,
        status: STATUS_MAP[values.validationStatus],
        doctrinalPrinciples: Array.from(principles),
        justification: values.justification,
        authorName: values.decidedBy,
        decidedAt: values.decisionDate ? `${values.decisionDate}T12:00:00.000Z` : undefined,
      };
      if (decisionId) return decisionsApi.update(decisionId, body);
      return decisionsApi.create(body);
    },
    onSuccess: () => toastSuccess("Décision enregistrée avec succès."),
  });

  function onSubmit(values: DecisionFormValues) {
    saveMut.mutate(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Intitulé</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="decisionType">Type de décision</Label>
          <Select value={form.watch("decisionType")} onValueChange={(v) => form.setValue("decisionType", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEC_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="decisionDate">Date</Label>
          <Input id="decisionDate" type="date" {...form.register("decisionDate")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Principes doctrinaux</Label>
        <MultiSelectPopover
          items={DOCTRINAL_PRINCIPLES_OPTIONS.map((p) => ({ id: p, label: p }))}
          selected={principles}
          onToggle={(id) =>
            setPrinciples((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              form.setValue("doctrinalPrinciples", Array.from(next), { shouldValidate: true });
              return next;
            })
          }
          placeholder="Sélectionner un ou plusieurs principes"
          emptyMessage="Aucun principe disponible."
          summary={(n) => (n === 1 ? "1 principe sélectionné" : `${n} principes sélectionnés`)}
        />
        {form.formState.errors.doctrinalPrinciples ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.doctrinalPrinciples.message as string}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="justification">Justification scientifique / technique</Label>
        <Textarea id="justification" rows={4} {...form.register("justification")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Zone</Label>
          <Select
            value={form.watch("zoneId")}
            onValueChange={(v) => form.setValue("zoneId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zList.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Observation liée</Label>
          <Select
            value={form.watch("observationId")}
            onValueChange={(v) => form.setValue("observationId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {obs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Pathologie (optionnel)</Label>
        <Select
          value={form.watch("pathologyId") || "none"}
          onValueChange={(v) => form.setValue("pathologyId", v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune</SelectItem>
            {pths.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Statut de validation</Label>
          <Select
            value={form.watch("validationStatus")}
            onValueChange={(v) =>
              form.setValue("validationStatus", v as DecisionFormValues["validationStatus"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="under_review">En validation</SelectItem>
              <SelectItem value="validated">Validé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="decidedBy">Décideur</Label>
          <Input id="decidedBy" {...form.register("decidedBy")} />
        </div>
      </div>
      {zonesQ.isLoading || obsQ.isLoading || pathQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}
      {zonesQ.isError || obsQ.isError || pathQ.isError ? (
        <p className="text-sm text-destructive">Impossible de charger les données du formulaire.</p>
      ) : null}
      <Button type="submit" disabled={saveMut.isPending}>
        {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
