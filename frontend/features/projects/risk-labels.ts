/** French labels for Prisma risk enums (UI). */

export const RISK_CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL: "Structurel",
  HERITAGE_VALUE: "Valeur patrimoniale",
  HEALTH_SAFETY: "Santé / sécurité",
  ENVIRONMENTAL: "Environnemental",
  SCHEDULE: "Planning",
  COST: "Coût",
  REPUTATIONAL: "Réputation",
  OTHER: "Autre",
};

export const RISK_PROBABILITY_LABELS: Record<string, string> = {
  RARE: "Rare",
  UNLIKELY: "Peu probable",
  POSSIBLE: "Possible",
  LIKELY: "Probable",
  ALMOST_CERTAIN: "Quasi certain",
};

export const RISK_IMPACT_LABELS: Record<string, string> = {
  NEGLIGIBLE: "Négligeable",
  MINOR: "Mineur",
  MODERATE: "Modéré",
  MAJOR: "Majeur",
  CATASTROPHIC: "Catastrophique",
};

export const RISK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  MITIGATING: "En atténuation",
  CLOSED: "Fermé",
  ACCEPTED: "Accepté",
};

export const RISK_CATEGORY_ORDER = [
  "STRUCTURAL",
  "HERITAGE_VALUE",
  "HEALTH_SAFETY",
  "ENVIRONMENTAL",
  "SCHEDULE",
  "COST",
  "REPUTATIONAL",
  "OTHER",
] as const;

export const RISK_PROBABILITY_ORDER = [
  "RARE",
  "UNLIKELY",
  "POSSIBLE",
  "LIKELY",
  "ALMOST_CERTAIN",
] as const;

export const RISK_IMPACT_ORDER = [
  "NEGLIGIBLE",
  "MINOR",
  "MODERATE",
  "MAJOR",
  "CATASTROPHIC",
] as const;

export const RISK_STATUS_ORDER = ["OPEN", "MITIGATING", "CLOSED", "ACCEPTED"] as const;
