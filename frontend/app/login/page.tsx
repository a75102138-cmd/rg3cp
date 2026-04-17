import { LoginForm } from "@/app/login/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
