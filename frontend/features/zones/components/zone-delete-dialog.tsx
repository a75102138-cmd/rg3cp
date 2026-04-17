"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zoneName: string;
  isPending: boolean;
  onConfirm: () => void;
};

export function ZoneDeleteDialog({ open, onOpenChange, zoneName, isPending, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer cette zone ?</DialogTitle>
          <DialogDescription className="text-left">
            Suppression définitive de « {zoneName} » : les sous-zones, éléments, essais laboratoire, documents et
            médias au niveau zone, risques zone, ainsi que la chaîne métier rattachée (observations, pathologies,
            décisions, interventions et leurs pièces jointes) seront supprimés en cascade.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Suppression…" : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

