import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { ObservationForm } from "@/features/observations/observation-form";

export default function NewObservationPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Observations", href: "/observations" },
          { label: "Nouvelle observation" },
        ]}
      />
      <PageTitle
        title="Nouvelle observation"
        description="Saisie guidée connectée à l’API."
      />
      <ObservationForm />
    </div>
  );
}
