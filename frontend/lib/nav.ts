import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  Camera,
  FileStack,
  FlaskConical,
  Home,
  LayoutDashboard,
  Library,
  MapPinned,
  Network,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Waypoints,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

/** Base path without query. `scope: "project"` = use current project in sidebar (see `withProjectQuery`). */
export type MainNavEntry = {
  title: string;
  path: string;
  icon: LucideIcon;
  scope: "global" | "project";
};

export const mainNavEntries: MainNavEntry[] = [
  { title: "Tableau de bord", path: "/", icon: LayoutDashboard, scope: "project" },
  { title: "Projets", path: "/projects", icon: Home, scope: "global" },
  { title: "Acteurs", path: "/actors", icon: Users, scope: "global" },
  { title: "Zones", path: "/zones", icon: MapPinned, scope: "project" },
  {
    title: "BDD_ADMIN_PILOTAGE & CADRE CONTRACTUEL",
    path: "/bdd-admin",
    icon: Building2,
    scope: "project",
  },
  {
    title: "BDD_DOCTRINE_BIBLIOTHEQUE",
    path: "/bdd-doctrine",
    icon: Library,
    scope: "project",
  },
  {
    title: "BDD_PLANS_ATLAS GRAPHIQUE & CARTOGRAPHIQUE",
    path: "/bdd-plans",
    icon: Waypoints,
    scope: "project",
  },
  {
    title: "BDD_MATERIAUX_LABORATOIRE & SCIENCE",
    path: "/bdd-materiaux",
    icon: FlaskConical,
    scope: "project",
  },
  {
    title: "BDD_ARCHEO_ARCHEOLOGIE & MEMOIRE DU SITE",
    path: "/bdd-archeo",
    icon: BookOpen,
    scope: "project",
  },
  {
    title: "BDD_LOGBOOK_LOGBOOK & JOURNAL DE BORD",
    path: "/bdd-logbook",
    icon: FileStack,
    scope: "project",
  },
  {
    title: "BDD_MEDIA_MEDIATHEQUE HD",
    path: "/bdd-media",
    icon: Camera,
    scope: "project",
  },
  {
    title: "BDD_FINANCIER_GESTION FINANCIERE",
    path: "/bdd-financier",
    icon: Network,
    scope: "project",
  },
  {
    title: "BDD_SECURITE_SECURITE & ENVIRONNEMENT",
    path: "/bdd-securite",
    icon: ShieldCheck,
    scope: "project",
  },
  {
    title: "BDD_QUALITE_ASSURANCE QUALITE",
    path: "/bdd-qualite",
    icon: Building2,
    scope: "project",
  },
  { title: "Validation", path: "/validation", icon: ShieldCheck, scope: "project" },
  { title: "Utilisateurs", path: "/users", icon: UserCog, scope: "global" },
  { title: "Paramètres", path: "/settings", icon: Settings, scope: "global" },
];

/** @deprecated Prefer `mainNavEntries` + `withProjectQuery` for sidebar. */
export const mainNav: NavItem[] = mainNavEntries.map((e) => ({
  title: e.title,
  href: e.path,
  icon: e.icon,
}));

export const flowHint = [
  { label: "Zone", icon: Waypoints },
  { label: "BDD", icon: FileStack },
  { label: "Suivi", icon: FlaskConical },
  { label: "Journal", icon: BookOpen },
];
