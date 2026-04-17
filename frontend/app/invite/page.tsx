import { Suspense } from "react";
import { InviteForm } from "./invite-form";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <InviteForm />
    </Suspense>
  );
}
