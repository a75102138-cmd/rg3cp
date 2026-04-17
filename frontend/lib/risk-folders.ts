export const RISK_FOLDER_CONFIG = {
  bdds: [
    {
      bddCategory: "BDD_SECURITE",
      tables: [
        { tableName: "T_SECURITE_CHANTIER", subFolders: ["GENERAL"] },
        { tableName: "T_ENVIRONNEMENT", subFolders: ["GENERAL"] },
        { tableName: "T_ACCES_SITE", subFolders: ["GENERAL"] },
      ],
    },
  ],
} as const;
