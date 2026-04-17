 "use client";

import { PageTitle } from "@/components/shared/page-title";
import { ValidationQueue } from "@/features/validation/validation-queue";
import { useAuth } from "@/providers/auth-provider";

export default function ValidationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin && user?.role !== "ACTEUR") {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Validation des fichiers"
          description="Réservé aux acteurs assignés aux projets."
        />
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Accès réservé au rôle ACTEUR.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Validation des fichiers"
        description={
          isAdmin
            ? "Suivi en lecture seule des fichiers en attente (supervision)."
            : "Traitez les documents et médias en attente : approuver, rejeter, commenter."
        }
      />
      <ValidationQueue />
    </div>
  );
}
