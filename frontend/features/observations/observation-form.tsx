"use client";

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
import { elementsApi, fetchAllPages, observationsApi, zonesApi } from "@/lib/api/resources";
import {
  observationSchema,
  type ObservationFormValues,
} from "@/lib/schemas/observation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProjectContext } from "@/providers/project-context";
import { toastSuccess } from "@/lib/toast-feedback";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const SEVERITY_MAP: Record<ObservationFormValues["severity"], string> = {
  info: "LOW",
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

export function ObservationForm({
  defaultValues,
  observationId,
}: {
  defaultValues?: Partial<ObservationFormValues>;
  observationId?: string;
}) {
  const { projectId } = useProjectContext();
  const zonesQ = useQuery({
    queryKey: ["zones", "observation-form", projectId],
    queryFn: () => fetchAllPages((page) => zonesApi.list({ page, limit: 100, projectId })),
    enabled: Boolean(projectId),
  });
  const zList = zonesQ.data ?? [];

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      category: "Structure / maçonnerie",
      zoneId: zList[0]?.id ?? "",
      elementId: "",
      status: "recorded",
      ...defaultValues,
    },
  });

  const zoneId = form.watch("zoneId");
  const elemsQ = useQuery({
    queryKey: ["elements", "observation-form", zoneId],
    queryFn: () => fetchAllPages((page) => elementsApi.list({ page, limit: 100, zoneId })),
    enabled: Boolean(zoneId),
  });
  const elems = useMemo(() => elemsQ.data ?? [], [elemsQ.data]);

  const saveMut = useMutation({
    mutationFn: (values: ObservationFormValues) => {
      const body = {
        zoneId: values.zoneId,
        elementId: values.elementId || undefined,
        observationType: "OTHER",
        severity: SEVERITY_MAP[values.severity],
        description: `${values.title}\n${values.description}`,
      };
      if (observationId) return observationsApi.update(observationId, body);
      return observationsApi.create(body);
    },
    onSuccess: () => toastSuccess("Observation enregistrée avec succès."),
  });

  function onSubmit(values: ObservationFormValues) {
    saveMut.mutate(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...form.register("description")} />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Sévérité</Label>
          <Select
            value={form.watch("severity")}
            onValueChange={(v) => form.setValue("severity", v as ObservationFormValues["severity"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="high">Élevé</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Input id="category" {...form.register("category")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Zone</Label>
        <Select
          value={form.watch("zoneId")}
          onValueChange={(v) => {
            form.setValue("zoneId", v);
            form.setValue("elementId", "");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir une zone" />
          </SelectTrigger>
          <SelectContent>
            {zList.map((z) => (
              <SelectItem key={z.id} value={z.id}>
                {z.code} — {z.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Élément (optionnel)</Label>
        <Select
          value={form.watch("elementId") || "none"}
          onValueChange={(v) => form.setValue("elementId", v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Aucun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {elems.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(v) => form.setValue("status", v as ObservationFormValues["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recorded">Enregistré</SelectItem>
            <SelectItem value="triaged">Trié</SelectItem>
            <SelectItem value="linked">Lié</SelectItem>
            <SelectItem value="closed">Clôturé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {zonesQ.isLoading || elemsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}
      {zonesQ.isError || elemsQ.isError ? (
        <p className="text-sm text-destructive">Impossible de charger les données du formulaire.</p>
      ) : null}
      <Button type="submit" disabled={saveMut.isPending}>
        {saveMut.isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
