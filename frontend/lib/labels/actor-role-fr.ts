export const ACTOR_ROLES = [
  "OWNER",
  "ARCHITECT",
  "COMPANY",
  "LABORATORY",
  "ENGINEERING_OFFICE",
  "EXPERT",
  "ADMINISTRATION",
  "CONTRACTOR",
  "OTHER",
] as const;

export const ACTOR_ROLE_LABEL_FR: Record<(typeof ACTOR_ROLES)[number], string> = {
  OWNER: "Maître d'ouvrage",
  ARCHITECT: "Architecte",
  COMPANY: "Entreprise",
  LABORATORY: "Laboratoire",
  ENGINEERING_OFFICE: "Bureau d'études",
  EXPERT: "Expert",
  ADMINISTRATION: "Administration",
  CONTRACTOR: "Contractant",
  OTHER: "Autre",
};
