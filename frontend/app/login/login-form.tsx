"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPassword, useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const from = searchParams.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email et mot de passe requis.");
      return;
    }
    setPending(true);
    try {
      await loginWithPassword(email.trim(), password);
      try {
        await refresh();
      } catch {
        // Login already succeeded and token is set.
        // Navigation will still be protected by middleware + /auth/me in app shell.
      }
      toast.success("Connexion réussie.");
      router.replace(from.startsWith("/") ? from : "/");
      router.refresh();
    } catch (err) {
      toast.error("Identifiants invalides ou compte inactif.");
      console.error(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.07] via-background to-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card/80 p-8 shadow-lg backdrop-blur">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">G3C — Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Accès réservé aux comptes autorisés. Utilisez votre email professionnel.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@g3c.local"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte ?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
