export const LOGBOOK_BDD_CATEGORY = "BDD_LOGBOOK";

export const LOGBOOK_FOLDER_CONFIG = {
  bddCategory: LOGBOOK_BDD_CATEGORY,
  tables: [
    {
      tableName: "T_PV_CHANTIER",
      subFolders: ["LES_PV", "PVS_TAPES", "PVS_TINMEL", "PV_MANIFOLD"],
    },
    { tableName: "T_FICHES_ZONES", subFolders: ["GENERAL"] },
    { tableName: "T_METEO_CONDITIONS", subFolders: ["GENERAL"] },
    { tableName: "T_INCIDENTS", subFolders: ["GENERAL"] },
    { tableName: "T_JOURNAL_QUOTIDIEN", subFolders: ["GENERAL"] },
  ],
} as const;

export function formatIsoDateFolder(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
