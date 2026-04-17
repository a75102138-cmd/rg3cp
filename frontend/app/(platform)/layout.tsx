import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PlatformAuthGate } from "@/components/layout/platform-auth-gate";
import { ProjectUrlSync } from "@/components/layout/project-url-sync";
import { Suspense } from "react";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformAuthGate>
      <div
        className="flex h-screen min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.06] via-background to-background"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <ProjectUrlSync />
        </Suspense>
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-0 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </PlatformAuthGate>
  );
}
