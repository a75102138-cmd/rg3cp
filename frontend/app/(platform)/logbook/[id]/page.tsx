import { getApiBase } from "@/lib/api/client";
import { notFound, redirect } from "next/navigation";

/** Ancienne URL /logbook/[id] → redirection vers le journal rattaché au projet. */
export default async function LegacyLogbookDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const base = getApiBase();
  const res = await fetch(`${base}/logbooks/${id}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) notFound();
  if (!res.ok) notFound();
  let data: { projectId?: string };
  try {
    data = (await res.json()) as { projectId?: string };
  } catch {
    notFound();
  }
  if (!data.projectId) notFound();
  redirect(`/journal/${id}`);
}
