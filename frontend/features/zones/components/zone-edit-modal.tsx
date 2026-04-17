"use client";

import { EntityFormModal } from "@/components/shared/entity-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const ZONE_EDIT_FORM_ID = "zone-detail-edit-form";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  code: string;
  projectName: string;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  nameError: string | null;
  setNameError: (v: string | null) => void;
  isPending: boolean;
  onSubmit: () => void;
};

export function ZoneEditModal(props: Props) {
  const {
    open,
    onOpenChange,
    code,
    projectName,
    name,
    setName,
    description,
    setDescription,
    nameError,
    setNameError,
    isPending,
    onSubmit,
  } = props;

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier la zone"
      description={
        <>
          {code} — contexte projet : {projectName}
        </>
      }
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form={ZONE_EDIT_FORM_ID} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </>
      }
    >
      <form
        id={ZONE_EDIT_FORM_ID}
        className="space-y-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          setNameError(null);
          if (!name.trim()) {
            setNameError("Le nom est obligatoire.");
            return;
          }
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="zn">Nom *</Label>
          <Input
            id="zn"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zd">Description</Label>
          <Textarea id="zd" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
      </form>
    </EntityFormModal>
  );
}

