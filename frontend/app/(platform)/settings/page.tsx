"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Paramètres" }]} />
      <PageTitle
        title="Paramètres plateforme"
        description="Préférences de projet, taxonomies et statuts — interface factice pour le MVP."
      />
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="flex h-auto flex-wrap rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="project">Projet</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomie</TabsTrigger>
          <TabsTrigger value="statuses">Statuts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="project" className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Préfixe codes zone</Label>
              <Input defaultValue="TNM-" />
            </div>
            <div className="space-y-2">
              <Label>Fuseau horaire chantier</Label>
              <Input defaultValue="Africa/Casablanca" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mention obligatoire rapports</Label>
            <Textarea rows={3} defaultValue="Document non contractuel — données de suivi interne." />
          </div>
          <Button type="button">Enregistrer (simulation)</Button>
        </TabsContent>
        <TabsContent value="taxonomy" className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Listes contrôlées pour catégories d’observation, types de pathologie et familles
            d’intervention.
          </p>
          <Separator />
          <div className="space-y-2">
            <Label>Catégories observation (CSV)</Label>
            <Textarea
              rows={4}
              defaultValue="Structure / maçonnerie, Humidité / hydrologie, Décors / enduits, Bois, Chantier / logistique"
            />
          </div>
        </TabsContent>
        <TabsContent value="statuses" className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="font-medium">Validation décision requise</p>
              <p className="text-sm text-muted-foreground">
                Bloque la création d’intervention si non validé.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="font-medium">Journal obligatoire les jours ouvrés</p>
              <p className="text-sm text-muted-foreground">Rappel à 17h sur espaces actifs.</p>
            </div>
            <Switch />
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="font-medium">Alertes risque critique</p>
              <p className="text-sm text-muted-foreground">Email + push interne.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
