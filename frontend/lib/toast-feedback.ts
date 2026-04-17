import { toast } from "sonner";

/** Messages génériques en français — jamais de détail technique côté utilisateur. */
export const TOAST_MSG = {
  saveFailed: "Impossible d’enregistrer pour le moment.",
  uploadFailed: "Impossible d’envoyer le fichier.",
  deleteFailed: "Impossible de supprimer pour le moment.",
  loadFailed: "Impossible de charger les données pour le moment.",
  unknown: "Une erreur inattendue s’est produite.",
} as const;

export function toastMutationError(_e: unknown, fallback: string = TOAST_MSG.saveFailed): void {
  toast.error(fallback);
}

export function toastUploadError(): void {
  toast.error(TOAST_MSG.uploadFailed);
}

export function toastSuccess(message: string): void {
  toast.success(message);
}
