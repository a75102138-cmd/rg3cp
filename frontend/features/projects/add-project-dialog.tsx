"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
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
import { projectsApi } from "@/lib/api/resources";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PROJECT_STATUSES = ["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"] as const;

const STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En pause",
  COMPLETED: "Terminé",
};

const projectCreateSchema = z
  .object({
    name: z
      .string()
      .max(255, "Le nom ne peut pas dépasser 255 caractères.")
      .refine((s) => s.trim().length > 0, {
        message: "Le nom du projet est requis.",
      }),
    location: z
      .string()
      .max(500, "La localisation ne peut pas dépasser 500 caractères.")
      .refine((s) => s.trim().length > 0, {
        message: "La localisation du site est requise.",
      }),
    startDate: z
      .string()
      .refine((s) => s.trim().length > 0 && ISO_DATE.test(s.trim()), {
        message: "La date de début est requise (format AAAA-MM-JJ).",
      }),
    plannedEndDate: z
      .string()
      .refine((s) => !s.trim() || ISO_DATE.test(s.trim()), {
        message: "Veuillez renseigner une date de fin prévue valide.",
      }),
    status: z.enum(PROJECT_STATUSES, {
      required_error: "Veuillez sélectionner un statut.",
      invalid_type_error: "Veuillez sélectionner un statut valide.",
    }),
    description: z
      .string()
      .max(10000, "La description ne peut pas dépasser 10 000 caractères.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const s = data.startDate?.trim();
    const e = data.plannedEndDate?.trim();
    if (s && e && s > e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin prévue doit être la même ou après la date de début.",
        path: ["plannedEndDate"],
      });
    }
  });

type ProjectCreateFormValues = z.infer<typeof projectCreateSchema>;

const defaultValues: ProjectCreateFormValues = {
  name: "",
  location: "",
  startDate: "",
  plannedEndDate: "",
  status: "PLANNED",
  description: "",
};

function mapCreateProjectError(): string {
  return "Impossible de créer le projet pour le moment.";
}

function mapCoverUploadError(): string {
  return "Impossible d’envoyer l’image de couverture.";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (info?: { coverUploadFailed?: boolean }) => void;
};

export function AddProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const form = useForm<ProjectCreateFormValues>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setCoverFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, reset]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-project-form-error='true']");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el?.querySelector<HTMLElement>(
        "input, textarea, button[role='combobox']",
      );
      focusable?.focus();
    });
  };

  const onCoverSelected = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Veuillez choisir un fichier image (JPEG, PNG, WebP…).");
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error("L’image est trop volumineuse (maximum 12 Mo).");
      return;
    }
    setCoverFile(f);
  };

  const clearCover = () => {
    setCoverFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onValid = async (data: ProjectCreateFormValues) => {
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: data.name.trim(),
        location: data.location.trim(),
        status: data.status,
        startDate: `${data.startDate.trim()}T00:00:00.000Z`,
      };
      const desc = data.description?.trim();
      if (desc) body.description = desc;
      if (data.plannedEndDate?.trim()) {
        body.plannedEndDate = `${data.plannedEndDate.trim()}T23:59:59.999Z`;
      }

      let project;
      try {
        project = await projectsApi.create(body);
      } catch {
        toast.error(mapCreateProjectError());
        return;
      }

      let coverUploadFailed = false;
      if (coverFile) {
        setIsUploadingCover(true);
        try {
          await projectsApi.uploadCover(project.id, coverFile);
        } catch {
          coverUploadFailed = true;
          toast.error(mapCoverUploadError());
        } finally {
          setIsUploadingCover(false);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      toast.success("Projet créé avec succès.");
      onCreated?.(coverUploadFailed ? { coverUploadFailed: true } : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    scrollToFirstError();
  };

  const busy = isSubmitting || isUploadingCover;

  const fieldRing = (hasError: boolean) =>
    cn(
      hasError &&
        "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
    );

  const formId = "add-project-form";

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau projet"
      description={
        <p>
          Un code unique du type <span className="font-mono">PRJ-0001</span> est attribué
          automatiquement — vous n’avez rien à saisir.
        </p>
      }
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Annuler
          </Button>
          <Button type="submit" form={formId} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploadingCover ? "Envoi de la couverture…" : "Création…"}
              </>
            ) : (
              "Créer le projet"
            )}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="flex flex-col"
        onSubmit={handleSubmit(onValid, onInvalid)}
        noValidate
      >
        <div className="grid gap-4">
          <div
            className="grid gap-2"
            data-project-form-error={errors.name ? "true" : undefined}
          >
            <Label htmlFor="proj-name">Nom *</Label>
            <Input
              id="proj-name"
              maxLength={255}
              autoComplete="off"
              disabled={busy}
              className={fieldRing(!!errors.name)}
              aria-invalid={!!errors.name}
              {...register("name")}
              placeholder="Ex. Restauration de la médersa …"
            />
            {errors.name?.message ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div
            className="grid gap-2"
            data-project-form-error={errors.location ? "true" : undefined}
          >
            <Label htmlFor="proj-location">Localisation du site *</Label>
            <Input
              id="proj-location"
              maxLength={500}
              disabled={busy}
              className={fieldRing(!!errors.location)}
              aria-invalid={!!errors.location}
              {...register("location")}
              placeholder="Commune, région, pays…"
            />
            {errors.location?.message ? (
              <p className="text-xs text-destructive">{errors.location.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="grid gap-2"
              data-project-form-error={errors.startDate ? "true" : undefined}
            >
              <Label htmlFor="proj-start">Date de début *</Label>
              <Input
                id="proj-start"
                type="date"
                disabled={busy}
                className={fieldRing(!!errors.startDate)}
                aria-invalid={!!errors.startDate}
                {...register("startDate")}
              />
              {errors.startDate?.message ? (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              ) : null}
            </div>
            <div
              className="grid gap-2"
              data-project-form-error={errors.plannedEndDate ? "true" : undefined}
            >
              <Label htmlFor="proj-planned-end">Fin prévue</Label>
              <Input
                id="proj-planned-end"
                type="date"
                disabled={busy}
                className={fieldRing(!!errors.plannedEndDate)}
                aria-invalid={!!errors.plannedEndDate}
                {...register("plannedEndDate")}
              />
              {errors.plannedEndDate?.message ? (
                <p className="text-xs text-destructive">{errors.plannedEndDate.message}</p>
              ) : null}
            </div>
          </div>

          <div
            className="grid gap-2"
            data-project-form-error={errors.status ? "true" : undefined}
          >
            <Label>Statut *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={busy}
                >
                  <SelectTrigger
                    id="proj-status"
                    className={fieldRing(!!errors.status)}
                    aria-invalid={!!errors.status}
                  >
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status?.message ? (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              rows={3}
              disabled={busy}
              className={fieldRing(!!errors.description)}
              aria-invalid={!!errors.description}
              {...register("description")}
              placeholder="Contexte du chantier patrimonial…"
            />
            {errors.description?.message ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Image de couverture</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => onCoverSelected(e.target.files)}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 gap-2 sm:w-auto"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                {coverFile ? "Changer l’image" : "Choisir une image"}
              </Button>
              {coverFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={busy}
                  onClick={clearCover}
                >
                  <X className="mr-1 h-4 w-4" />
                  Retirer
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Affichée sur la carte et l’en-tête du projet. Formats image courants, jusqu’à 12 Mo.
              Enregistrement sécurisé après la création du projet.
            </p>
            {coverPreview ? (
              <div className="relative mt-1 max-h-52 overflow-hidden rounded-lg border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="Aperçu de la couverture"
                  className="max-h-52 w-full object-contain object-center"
                />
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </EntityFormModal>
  );
}
