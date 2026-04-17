"use client";

import { ProjectParamSync } from "@/components/layout/project-param-sync";

export default function ProjectScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProjectParamSync />
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
