"use client";

import { ActivityFeed } from "@/components/shared/activity-feed";
import type { ActivityFeedItem } from "@/components/shared/activity-feed";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageTitle } from "@/components/shared/page-title";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toBadgeStatus } from "@/lib/api/badge";
import { fetchDashboardBundle } from "@/lib/api/dashboard-bundle";
import { formatDate } from "@/lib/format";
import { useProjectContext } from "@/providers/project-context";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  FolderOpen,
  Gavel,
  Image as ImageIcon,
  Layers,
  Plus,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "hsl(0 72% 42%)",
  HIGH: "hsl(25 90% 42%)",
  MEDIUM: "hsl(45 90% 40%)",
  LOW: "hsl(142 40% 38%)",
  NONE: "hsl(220 14% 70%)",
};

function buildActivityFeed(
  observations: Awaited<ReturnType<typeof fetchDashboardBundle>>["observations"],
  decisions: Awaited<ReturnType<typeof fetchDashboardBundle>>["decisions"],
  logbooks: Awaited<ReturnType<typeof fetchDashboardBundle>>["logbooks"],
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];
  for (const o of observations) {
    items.push({
      id: `obs-${o.id}`,
      at: o.observedAt ?? o.id,
      label: `Observation : ${o.title}`,
      type: "observation",
      href: `/observations/${o.id}`,
    });
  }
  for (const d of decisions) {
    items.push({
      id: `dec-${d.id}`,
      at: d.decidedAt ? `${d.decidedAt}` : d.id,
      label: `Décision : ${d.title}`,
      type: "decision",
      href: `/decisions/${d.id}`,
    });
  }
  for (const l of logbooks) {
    items.push({
      id: `log-${l.id}`,
      at: l.eventAt ? `${l.eventAt}` : l.id,
      label: `Journal : ${l.title}`,
      type: "logbook",
      href: `/journal/${l.id}`,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-muted/30 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const {
    project,
    projectId,
    projects,
    isProjectsListLoading,
    isProjectsListError,
    refetchProjects,
  } = useProjectContext();

  const dash = useQuery({
    queryKey: ["dashboard", projectId],
    queryFn: () => fetchDashboardBundle(projectId),
    enabled: Boolean(projectId),
  });

  const obsByZone = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of dash.data?.observations ?? []) {
      m.set(o.zoneId, (m.get(o.zoneId) ?? 0) + 1);
    }
    return m;
  }, [dash.data?.observations]);

  const barData = useMemo(() => {
    return (dash.data?.zones ?? []).map((zz) => ({
      name: zz.code,
      observations: obsByZone.get(zz.id) ?? 0,
      interventions: (dash.data?.interventions ?? []).filter((i) => i.zoneId === zz.id).length,
    }));
  }, [dash.data?.zones, dash.data?.interventions, obsByZone]);

  const topZones = useMemo(() => {
    const zones = dash.data?.zones ?? [];
    return [...zones]
      .map((z) => ({ z, n: obsByZone.get(z.id) ?? 0 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 4)
      .map(({ z }) => z);
  }, [dash.data?.zones, obsByZone]);

  const activity = useMemo(() => {
    if (!dash.data) return [];
    return buildActivityFeed(
      dash.data.observations,
      dash.data.decisions,
      dash.data.logbooks,
    );
  }, [dash.data]);

  const severityPieData = useMemo(() => {
    const obs = dash.data?.observations ?? [];
    const counts = new Map<string, number>();
    for (const o of obs) {
      const k = o.severity?.toUpperCase() ?? "NONE";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const rows: { name: string; value: number; fill: string }[] = [];
    for (const sev of SEVERITY_ORDER) {
      const v = counts.get(sev) ?? 0;
      if (v) rows.push({ name: sev, value: v, fill: SEVERITY_COLORS[sev] ?? "#888" });
    }
    const none = counts.get("NONE") ?? 0;
    if (none)
      rows.push({ name: "Non renseigné", value: none, fill: SEVERITY_COLORS.NONE });
    return rows;
  }, [dash.data?.observations]);

  const interventionStatusData = useMemo(() => {
    const ints = dash.data?.interventions ?? [];
    const m = new Map<string, number>();
    for (const i of ints) {
      const s = i.status ?? "AUTRE";
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name: name.replaceAll("_", " "), value }));
  }, [dash.data?.interventions]);

  if (isProjectsListLoading && !projects.length) {
    return <DashboardSkeleton />;
  }

  if (isProjectsListError) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageTitle
          title="Cockpit projet"
          description="Connexion à l’API des projets impossible."
        />
        <Card className="rounded-xl border-destructive/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Erreur réseau ou serveur</CardTitle>
            <CardDescription>
              Vérifiez que le backend est démarré et que{" "}
              <code className="rounded bg-muted px-1 text-foreground">NEXT_PUBLIC_API_BASE_URL</code>{" "}
              pointe vers l’API (ex. http://localhost:3001/api).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => refetchProjects()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isProjectsListLoading && !projects.length) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-10 text-center md:py-16">
        <div className="rounded-full border bg-muted/40 p-6 shadow-sm">
          <FolderOpen className="h-14 w-14 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Aucun projet disponible</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Commencez par créer un projet patrimonial pour activer le cockpit de suivi : zones,
            observations, décisions et interventions.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 rounded-xl">
          <Link href="/projects">
            <Plus className="h-4 w-4" />
            Créer un projet
          </Link>
        </Button>
      </div>
    );
  }

  if (!projectId || !project) {
    return <DashboardSkeleton />;
  }

  if (dash.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dash.isError || !dash.data) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Cockpit projet"
          description={project.name}
        />
        <Card className="rounded-xl border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Impossible de charger les données du tableau de bord
            </CardTitle>
            <CardDescription className="text-destructive/90">
              Vérifiez l’API et les droits d’accès aux zones de ce projet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => dash.refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/projects/${project.id}`}>Fiche projet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { zones, observations, decisions, interventions, risks, logbooks, photos, documents } =
    dash.data;

  const zonesCount = project._count?.zones ?? zones.length;
  const decisionsPending = decisions.filter(
    (d) => !["APPROVED", "CANCELLED", "SUPERSEDED"].includes(d.status),
  ).length;
  const interventionsActive = interventions.filter((i) =>
    ["IN_PROGRESS", "PLANNED"].includes(i.status),
  ).length;
  const risksOpen = risks.length;
  const ongoingInterventions = interventions.filter((i) =>
    ["IN_PROGRESS", "PLANNED"].includes(i.status),
  );

  return (
    <div className="space-y-8">
      {projects.length > 1 ? (
        <Card className="rounded-xl border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{projects.length}</span> projets dans la
              plateforme — le cockpit ci-dessous concerne{" "}
              <span className="font-medium text-foreground">{project.code}</span>.
            </p>
            <Link href="/projects" className="text-xs font-medium text-bronze hover:underline">
              Gérer les projets →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageTitle
          title="Cockpit projet"
          description={`Vue opérationnelle pour ${project.name} — indicateurs filtrés sur le projet sélectionné dans l’en-tête.`}
        />
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-bronze hover:underline"
        >
          Fiche projet complète →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Zones"
          value={zonesCount}
          hint="Hiérarchie chantier"
          icon={Layers}
        />
        <KpiCard
          title="Observations"
          value={observations.length}
          hint="Total chargé"
          icon={ClipboardList}
        />
        <KpiCard
          title="Décisions actives"
          value={decisionsPending}
          hint="Hors approuvé / clos"
          icon={Gavel}
        />
        <KpiCard
          title="Interventions"
          value={interventionsActive}
          hint="Planifié ou en cours"
          icon={Wrench}
        />
        <KpiCard
          title="Documents"
          value={documents.length}
          hint="Pièces liées au projet"
          icon={FileText}
        />
        <KpiCard
          title="Risques ouverts"
          value={risksOpen}
          hint="Statut ≠ clos"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Charge par zone (observations / interventions)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {barData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar
                    dataKey="observations"
                    fill="hsl(222 40% 18% / 0.85)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="interventions"
                    fill="hsl(28 35% 42% / 0.9)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucune zone — créez des zones pour visualiser la charge.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Observations par gravité</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              {severityPieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {severityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Aucune observation
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Interventions par statut</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              {interventionStatusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interventionStatusData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(28 35% 42% / 0.85)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Aucune intervention
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Zones les plus documentées</CardTitle>
            <Link href={`/projects/${project.id}/zones`} className="text-xs font-medium text-bronze hover:underline">
              Toutes les zones
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topZones.map((zz) => (
              <div
                key={zz.id}
                className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2"
              >
                <div>
                  <Link href={`/zones/${zz.id}`} className="font-medium hover:underline">
                    {zz.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{zz.code}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {obsByZone.get(zz.id) ?? 0} obs.
                </span>
              </div>
            ))}
            {!topZones.length ? (
              <p className="text-sm text-muted-foreground">Aucune zone pour ce projet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dernières observations</CardTitle>
            <Link href="/observations" className="text-xs font-medium text-bronze hover:underline">
              Module observations
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {observations
              .slice()
              .filter((o) => o.observedAt)
              .sort((a, b) => (b.observedAt ?? "").localeCompare(a.observedAt ?? ""))
              .slice(0, 5)
              .map((o) => (
                <div key={o.id} className="rounded-xl border px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {o.severity ? <SeverityBadge severity={o.severity} /> : null}
                  </div>
                  <Link
                    href={`/observations/${o.id}`}
                    className="mt-1 block font-medium hover:underline"
                  >
                    {o.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {o.observedAt ? formatDate(o.observedAt) : "—"} ·{" "}
                    {o.authorName?.trim() || "—"}
                  </p>
                </div>
              ))}
            {!observations.length ? (
              <p className="text-sm text-muted-foreground">Aucune observation.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Décisions hors statut approuvé</CardTitle>
            <Link href="/decisions" className="text-xs font-medium text-bronze hover:underline">
              Registre des décisions
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {decisions
              .filter((d) => d.status !== "APPROVED")
              .map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-1 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link href={`/decisions/${d.id}`} className="font-medium hover:underline">
                      {d.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {d.decidedAt ? formatDate(d.decidedAt) : "—"}
                    </p>
                  </div>
                  <StatusBadge status={toBadgeStatus(d.status)} />
                </div>
              ))}
            {!decisions.length ? (
              <p className="text-sm text-muted-foreground">Aucune décision.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documents récents</CardTitle>
            <Link href={`/projects/${project.id}/documents`} className="text-xs font-medium text-bronze hover:underline">
              Bibliothèque
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <Link
                key={doc.id}
                href={`/projects/${project.id}/documents`}
                className="flex items-center gap-2 rounded-lg border px-2 py-2 text-sm hover:bg-muted/50"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 font-medium">
                  {doc.title ?? doc.originalFilename ?? doc.id}
                </span>
              </Link>
            ))}
            {!documents.length ? (
              <p className="text-sm text-muted-foreground">Aucun document.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Interventions en cours</CardTitle>
            <Link href="/interventions" className="text-xs font-medium text-bronze hover:underline">
              Vue liste
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {ongoingInterventions.map((i) => (
              <div key={i.id} className="space-y-2 rounded-xl border px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/interventions/${i.id}`} className="font-medium hover:underline">
                    {i.interventionType.replaceAll("_", " ")}
                  </Link>
                  <StatusBadge status={toBadgeStatus(i.status)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {i.companyName?.trim() || "—"}
                </p>
              </div>
            ))}
            {!ongoingInterventions.length ? (
              <p className="text-sm text-muted-foreground">Aucune intervention en cours.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Photos récentes</CardTitle>
              <Link href={`/projects/${project.id}/media`} className="text-xs font-medium text-bronze hover:underline">
                Médias
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {photos.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  href={`/projects/${project.id}/media`}
                  className="flex items-center gap-2 rounded-lg border px-2 py-2 text-sm hover:bg-muted/50"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2 font-medium">
                    {m.caption ?? m.originalFilename ?? m.id}
                  </span>
                </Link>
              ))}
              {!photos.length ? (
                <p className="text-sm text-muted-foreground">Aucune photo.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4" />
                Risques
              </CardTitle>
              <Link href={`/projects/${project.id}/risques`} className="text-xs font-medium text-bronze hover:underline">
                Dossiers risques
              </Link>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 pr-3">
                <ul className="space-y-2">
                  {risks.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border bg-card/60 px-3 py-2 text-sm"
                    >
                      <Link href={`/projects/${project.id}?tab=risks`} className="font-medium hover:underline">
                        {r.title ?? r.originalFilename ?? r.id}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.status ? <StatusBadge status={toBadgeStatus(r.status)} /> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              {!risks.length ? (
                <p className="text-sm text-muted-foreground">Aucun risque enregistré.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Journal de chantier récent
          </CardTitle>
          <Link href={`/projects/${project.id}/journal`} className="text-xs font-medium text-bronze hover:underline">
            Toutes les entrées
          </Link>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {logbooks.slice(0, 4).map((l) => (
            <Link
              key={l.id}
              href={`/journal/${l.id}`}
              className="block rounded-xl border px-3 py-2 hover:bg-muted/40"
            >
              <p className="text-xs text-muted-foreground">
                {l.eventAt ? formatDate(l.eventAt) : "—"}
              </p>
              <p className="font-medium">{l.title}</p>
            </Link>
          ))}
          {!logbooks.length ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">Aucune entrée de journal.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            Flux d’activité récent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={activity} />
        </CardContent>
      </Card>
    </div>
  );
}
