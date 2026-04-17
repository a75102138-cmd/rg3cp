import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { DecisionForm } from "@/features/decisions/decision-form";

export default function NewDecisionPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Décisions", href: "/decisions" },
          { label: "Nouvelle décision" },
        ]}
      />
      <PageTitle
        title="Nouvelle décision"
        description="Formaliser le principe doctrinal et lier l’observation source."
      />
      <DecisionForm />
    </div>
  );
}
