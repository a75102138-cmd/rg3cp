"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/resources";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InviteInfo = {
  firstName: string;
  lastName: string;
  email: string;
  expiresAt: string;
};

export function InviteForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!token) {
        setLoadingInfo(false);
        return;
      }
      try {
        const data = await authApi.verifyInvitation({ token });
        if (!cancelled) setInviteInfo(data);
      } catch {
        if (!cancelled) setInviteInfo(null);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    }
    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      toast.error("Token d'invitation manquant.");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("La confirmation du mot de passe ne correspond pas.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.acceptInvitation({ token, password });
      toast.success("Compte active avec succes. Vous pouvez maintenant vous connecter.");
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      toast.error("Impossible d'activer ce compte. Le lien est peut-etre expire.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.07] via-background to-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card/80 p-8 shadow-lg backdrop-blur">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Activation du compte</h1>
          <p className="text-sm text-muted-foreground">
            Definissez votre mot de passe pour activer votre acces.
          </p>
        </div>

        {loadingInfo ? (
          <p className="text-center text-sm text-muted-foreground">Verification de l'invitation...</p>
        ) : !inviteInfo ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-destructive">Invitation invalide ou expiree.</p>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <p className="font-medium">
                {inviteInfo.firstName} {inviteInfo.lastName}
              </p>
              <p className="text-muted-foreground">{inviteInfo.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Activation..." : "Activer mon compte"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
