"use client";

import { AdminOverview } from "@/features/admin/admin-overview";
import { ActeurDashboard } from "@/features/dashboard/acteur-dashboard";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { UserDashboard } from "@/features/dashboard/user-dashboard";
import { useAuth } from "@/providers/auth-provider";

export default function ProjectDashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-dashed bg-muted/40" />;
  }

  if (user?.role === "ADMIN") return <AdminOverview />;
  if (user?.role === "ACTEUR") return <ActeurDashboard />;
  if (user?.role === "USER") return <UserDashboard />;
  return <DashboardView />;
}
