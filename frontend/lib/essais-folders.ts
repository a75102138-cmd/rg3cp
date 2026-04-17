export const ESSAIS_BDD_CATEGORY = "MATERIAUX";

export const ESSAIS_FOLDER_CONFIG = {
  bddCategory: ESSAIS_BDD_CATEGORY,
  tables: [
    {
      tableName: "T_ANALYSES_CARACTERISATION",
      subFolders: ["non valides", "rapport essais", "Resultats Briques", "Resultats Beton"],
    },
    {
      tableName: "T_ESSAIS_CONVENANCE",
      subFolders: [
        {
          name: "PV_AGREMENT",
          children: ["Dossier PV chantier", "LSR", "LPEE"],
        },
        "Essaie de compactage",
      ],
    },
    {
      tableName: "T_FICHES_TECHNIQUES",
      subFolders: ["Fiches Techniques Chaux", "autres FT"],
    },
    {
      tableName: "T_PROVENANCE",
      subFolders: ["Bons de livraison"],
    },
  ],
} as const;
