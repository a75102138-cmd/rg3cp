import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  planning: "bg-slate-100 text-slate-800 border-slate-200",
  active: "bg-emerald-50 text-emerald-900 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-900 border-amber-200",
  completed: "bg-stone-100 text-stone-700 border-stone-200",
  verified: "bg-emerald-50 text-emerald-900 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-600 border-zinc-200",
  recorded: "bg-slate-50 text-slate-700 border-slate-200",
  triaged: "bg-sky-50 text-sky-900 border-sky-200",
  linked: "bg-indigo-50 text-indigo-900 border-indigo-200",
  closed: "bg-stone-100 text-stone-600 border-stone-200",
  identified: "bg-orange-50 text-orange-900 border-orange-200",
  under_study: "bg-amber-50 text-amber-900 border-amber-200",
  decided: "bg-violet-50 text-violet-900 border-violet-200",
  under_treatment: "bg-teal-50 text-teal-900 border-teal-200",
  stabilized: "bg-emerald-50 text-emerald-900 border-emerald-200",
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  under_review: "bg-amber-50 text-amber-900 border-amber-200",
  validated: "bg-emerald-50 text-emerald-900 border-emerald-200",
  rejected: "bg-red-50 text-red-900 border-red-200",
  planned: "bg-slate-50 text-slate-800 border-slate-200",
  in_progress: "bg-blue-50 text-blue-900 border-blue-200",
  paused: "bg-amber-50 text-amber-900 border-amber-200",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
  requested: "bg-sky-50 text-sky-900 border-sky-200",
  in_lab: "bg-indigo-50 text-indigo-900 border-indigo-200",
  open: "bg-red-50 text-red-900 border-red-200",
  mitigating: "bg-amber-50 text-amber-900 border-amber-200",
  accepted: "bg-stone-100 text-stone-600 border-stone-200",
  stable: "bg-emerald-50 text-emerald-900 border-emerald-200",
  monitoring: "bg-sky-50 text-sky-900 border-sky-200",
  critical: "bg-red-50 text-red-900 border-red-200",
  intervention: "bg-orange-50 text-orange-900 border-orange-200",
  sound: "bg-emerald-50 text-emerald-900 border-emerald-200",
  degraded: "bg-amber-50 text-amber-900 border-amber-200",
  under_work: "bg-blue-50 text-blue-900 border-blue-200",
  restored: "bg-teal-50 text-teal-900 border-teal-200",
  proposed: "bg-sky-50 text-sky-900 border-sky-200",
  approved: "bg-emerald-50 text-emerald-900 border-emerald-200",
  superseded: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const labels: Record<string, string> = {
  planning: "Planification",
  active: "Actif",
  on_hold: "En pause",
  completed: "Terminé",
  verified: "Vérifié",
  archived: "Archivé",
  recorded: "Enregistré",
  triaged: "Trié",
  linked: "Lié",
  closed: "Clôturé",
  identified: "Identifié",
  under_study: "À l’étude",
  decided: "Décidé",
  under_treatment: "En traitement",
  stabilized: "Stabilisé",
  draft: "Brouillon",
  under_review: "En validation",
  validated: "Validé",
  rejected: "Rejeté",
  planned: "Planifié",
  in_progress: "En cours",
  paused: "Suspendu",
  cancelled: "Annulé",
  requested: "Demandé",
  in_lab: "Au laboratoire",
  open: "Ouvert",
  mitigating: "Atténuation",
  accepted: "Accepté",
  stable: "Stable",
  monitoring: "Surveillance",
  critical: "Critique",
  intervention: "Intervention",
  sound: "Sain",
  degraded: "Dégradé",
  under_work: "En travaux",
  restored: "Restauré",
  proposed: "Proposé",
  approved: "Approuvé",
  superseded: "Remplacé",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: ReactNode;
}) {
  const style = statusStyles[status] ?? "bg-muted text-muted-foreground";
  const label = children ?? labels[status] ?? "Autre statut";
  return (
    <Badge
      variant="outline"
      className={cn("font-normal normal-case", style, className)}
    >
      {label}
    </Badge>
  );
}
