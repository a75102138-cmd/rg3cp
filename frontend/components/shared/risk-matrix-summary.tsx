"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Risk } from "@/types/domain";
import { cn } from "@/lib/utils";

const probOrder = [
  "rare",
  "unlikely",
  "possible",
  "likely",
  "almost_certain",
] as const;
const impactOrder = [
  "negligible",
  "minor",
  "moderate",
  "major",
  "catastrophic",
] as const;

/** Accepte les libellés domaine (snake) ou les enums Prisma (SCREAMING_SNAKE). */
function normProbKey(raw: string | null | undefined): (typeof probOrder)[number] | null {
  if (raw == null || raw === "") return null;
  const k = raw.trim().toLowerCase().replace(/-/g, "_");
  if ((probOrder as readonly string[]).includes(k)) return k as (typeof probOrder)[number];
  const map: Record<string, (typeof probOrder)[number]> = {
    rare: "rare",
    unlikely: "unlikely",
    possible: "possible",
    likely: "likely",
    almost_certain: "almost_certain",
  };
  const fromEnum = raw.trim().toUpperCase();
  const e: Record<string, (typeof probOrder)[number]> = {
    RARE: "rare",
    UNLIKELY: "unlikely",
    POSSIBLE: "possible",
    LIKELY: "likely",
    ALMOST_CERTAIN: "almost_certain",
  };
  return map[k] ?? e[fromEnum] ?? null;
}

function normImpactKey(raw: string | null | undefined): (typeof impactOrder)[number] | null {
  if (raw == null || raw === "") return null;
  const k = raw.trim().toLowerCase().replace(/-/g, "_");
  if ((impactOrder as readonly string[]).includes(k)) return k as (typeof impactOrder)[number];
  const map: Record<string, (typeof impactOrder)[number]> = {
    negligible: "negligible",
    minor: "minor",
    moderate: "moderate",
    major: "major",
    catastrophic: "catastrophic",
  };
  const fromEnum = raw.trim().toUpperCase();
  const e: Record<string, (typeof impactOrder)[number]> = {
    NEGLIGIBLE: "negligible",
    MINOR: "minor",
    MODERATE: "moderate",
    MAJOR: "major",
    CATASTROPHIC: "catastrophic",
  };
  return map[k] ?? e[fromEnum] ?? null;
}

const probLabel: Record<(typeof probOrder)[number], string> = {
  rare: "Rare",
  unlikely: "Peu probable",
  possible: "Possible",
  likely: "Probable",
  almost_certain: "Quasi certain",
};

const impactLabel: Record<(typeof impactOrder)[number], string> = {
  negligible: "Négligeable",
  minor: "Mineur",
  moderate: "Modéré",
  major: "Majeur",
  catastrophic: "Catastrophique",
};

export function RiskMatrixSummary({
  risks,
  className,
}: {
  /** Domaine `Risk` ou réponses API (`ApiRisk`) avec enums Prisma. */
  risks: Array<
    Pick<Risk, "probability" | "impact"> | { probability?: string | null; impact?: string | null }
  >;
  className?: string;
}) {
  const matrix = new Map<string, number>();
  for (const r of risks) {
    const raw = r as { probability?: string | null; impact?: string | null };
    const p = normProbKey(raw.probability);
    const im = normImpactKey(raw.impact);
    if (!p || !im) continue;
    const key = `${p}:${im}`;
    matrix.set(key, (matrix.get(key) ?? 0) + 1);
  }

  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-base">Matrice probabilité × impact</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="border bg-muted/40 p-2 text-left font-medium">
                Probabilité \ Impact
              </th>
              {impactOrder.map((imp) => (
                <th
                  key={imp}
                  className="border bg-muted/40 p-2 text-center font-medium"
                >
                  {impactLabel[imp]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {probOrder.map((prob) => (
              <tr key={prob}>
                <td className="border bg-muted/20 p-2 font-medium">
                  {probLabel[prob]}
                </td>
                {impactOrder.map((imp) => {
                  const n = matrix.get(`${prob}:${imp}`) ?? 0;
                  const heat =
                    n === 0
                      ? "bg-background"
                      : n === 1
                        ? "bg-amber-50"
                        : n <= 3
                          ? "bg-orange-100"
                          : "bg-red-100";
                  return (
                    <td
                      key={`${prob}-${imp}`}
                      className={cn(
                        "border p-2 text-center font-semibold",
                        heat
                      )}
                    >
                      {n || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
