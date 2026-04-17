"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zonesApi } from "@/lib/api/resources";
import { toastMutationError, toastSuccess } from "@/lib/toast-feedback";
import type { ApiZone } from "@/types/api";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Affiché en lecture seule (contexte page projet). */
  projectName?: string;
  editingZone: ApiZone | null;
  onSuccess: () => void;
};

const FORM_ID = "zone-form-dialog";

export function ZoneFormDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  editingZone,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNameError(null);
    setCoverFile(null);
    setCoverPreview(null);
    if (editingZone) {
      setName(editingZone.name);
      setDescription(editingZone.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [open, editingZone]);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreview(editingZone?.imageUrl ?? null);
  }, [coverFile, editingZone?.imageUrl, editingZone?.id]);

  const onCoverSelected = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setNameError(null);
      return;
    }
    setCoverFile(f);
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(editingZone?.imageUrl ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nm = name.trim();
      const desc = description.trim();
      if (editingZone) {
        await zonesApi.update(editingZone.id, {
          name: nm,
          description: desc ? desc : null,
        });
        if (coverFile) {
          await zonesApi.uploadCover(editingZone.id, coverFile);
        }
        return;
      }
      const created = await zonesApi.create({
        projectId,
        name: nm,
        description: desc || undefined,
      });
      if (coverFile) {
        await zonesApi.uploadCover(created.id, coverFile);
      }
    },
    onSuccess: () => {
      toastSuccess(editingZone ? "Zone enregistrée avec succès." : "Zone créée avec succès.");
      onSuccess();
      onOpenChange(false);
    },
    onError: (e: unknown) => toastMutationError(e),
  });

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={editingZone ? "Modifier la zone" : "Nouvelle zone"}
      variant="form"
      size="sm"
      bodyClassName="max-h-[70vh] overflow-y-auto"
      description={
        <>
          {projectName ? (
            <p>
              Projet : <span className="font-medium text-foreground">{projectName}</span> — rattachement
              automatique (aucun choix de projet dans le formulaire).
            </p>
          ) : null}
          <p>
            {editingZone
              ? "Le code métier reste inchangé. Il s’affiche sur la fiche et les cartes."
              : "Un code unique sera attribué automatiquement à partir du nom."}
          </p>
        </>
      }
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form={FORM_ID} size="sm" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Enregistrement…
              </>
            ) : editingZone ? (
              "Enregistrer"
            ) : (
              "Créer la zone"
            )}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="grid gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          setNameError(null);
          if (!name.trim()) {
            setNameError("Le nom est obligatoire.");
            return;
          }
          saveMutation.mutate();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="z-name" className="text-xs font-medium">
            Nom *
          </Label>
          <Input
            id="z-name"
            required
            maxLength={255}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Ex. Salle de prière"
            className="h-9"
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="z-desc" className="text-xs font-medium">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optionnel)</span>
          </Label>
          <Textarea
            id="z-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexte, périmètre, précisions…"
            className="min-h-[88px] resize-y text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-medium">
            Image de couverture{" "}
            <span className="font-normal text-muted-foreground">(optionnel)</span>
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onCoverSelected(e.target.files)}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full shrink-0 gap-2 sm:w-auto"
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
                className="h-9 text-muted-foreground"
                onClick={clearCover}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Retirer l’aperçu
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enregistrement sous{" "}
            <span className="font-mono text-[10px]">rg3cp/&lt;code projet&gt;/zones/&lt;code zone&gt;/cover</span>{" "}
            (codes métier, comme pour le reste du dépôt).
          </p>
          {coverPreview ? (
            <div className="relative mt-1 max-h-48 overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreview}
                alt="Aperçu couverture zone"
                className="max-h-48 w-full object-cover object-center"
              />
            </div>
          ) : null}
        </div>
      </form>
    </EntityFormModal>
  );
}
