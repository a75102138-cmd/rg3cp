export const DOCUMENT_FOLDER_CONFIG = {
  bdds: [
    {
      bddCategory: "BDD_ADMIN",
      label: "BDD_ADMIN",
      tables: [
        {
          tableName: "T_CONTRATS",
          subFolders: [
            {
              name: "Marché public initial",
              children: ["CPS", "CCAG", "CCAP", "C3G"],
            },
            "Contrat",
            {
              name: "Conventions de sous-traitance",
              children: [
                "Convention ARCHÉOLOGUE",
                "Convention Geo tech topo",
                "Convention ITT Mouad Mesbahi",
              ],
            },
            "Contrats des Maâlems (artisans traditionnels)",
            "Actes d’engagement",
            "Bordereaux des prix unitaires (BPU)",
          ],
        },
        {
          tableName: "T_ORDRES_SERVICE",
          subFolders: [
            "OS de commencement des travaux",
            "OS de notification de lancement",
            "OS d’approbation du marché",
            "OS d’arrêt de chantier (avec motifs)",
            "OS de reprise des travaux",
          ],
        },
        {
          tableName: "T_COURRIERS",
          subFolders: [
            "Lettres de mise en demeure",
            "Lettres de réclamation",
            "Demandes de prorogation de délai",
            "Notifications de difficultés imprévues",
            "Réponses aux observations de la MOA",
            "Courriers de réserve technique",
            "Accusés de réception (scans)",
          ],
        },
        {
          tableName: "T_ASSURANCES",
          subFolders: [
            "Police TRC (Tous Risques Chantier)",
            "Caution d’avance",
            "Attestation RC professionnelle",
            "Caution définitive",
            "Caution de retenue de garantie",
            "Attestations CNSS",
            "Attestations fiscales",
            "Garanties décennales",
            "Certificats d’assurance des sous-traitants",
          ],
        },
        {
          tableName: "T_RESSOURCES_HUMAINES",
          subFolders: [
            "Trombinoscope équipe projet",
            "CV des experts et chefs de lot",
            "Planning des affectations",
            "Registres de pointage",
          ],
        },
        {
          tableName: "T_PLANNING",
          subFolders: [
            "Planning initial contractuel",
            "Planning recalé (versions successives)",
            "Chemins critiques identifiés",
            "Analyses des retards",
            "Calendriers des intempéries",
          ],
        },
      ],
    },
    {
      bddCategory: "BDD_DOCTRINE",
      label: "BDD_DOCTRINE",
      tables: [
        { tableName: "T_CHARTES_INTERNATIONALES", subFolders: ["GENERAL"] },
        { tableName: "T_NORMES_TECHNIQUES", subFolders: ["GENERAL"] },
        { tableName: "T_NOTES_POSITIONNEMENT", subFolders: ["GENERAL"] },
      ],
    },
    {
      bddCategory: "BDD_PLANS",
      label: "BDD_PLANS",
      tables: [
        {
          tableName: "T_RELEVES_SOURCES",
          subFolders: [
            "Nuages de points",
            "Orthophotographies HD",
            "Scans Leica",
            "Relevés photogrammétriques",
            "Levés topographiques",
            "Relevés pierre à pierre",
            "Cartographie des désordres",
            "Thermographies infrarouge",
          ],
        },
        {
          tableName: "T_PLANS_EXECUTION",
          subFolders: [
            '1.Plans architecturaux',
            '2.Plans structurels',
            '3.Plans de calepinage',
            '4.Plans de charpente',
            '5.Plans d’étanchéité',
            '6.Plans des réseaux techniques',
            '7.Détails constructifs',
            '8.Coupes techniques types',
            '9.Plans de repérage des zones',
            '10.Plans d’implantation échafaudages',
          ],
        },
        {
          tableName: "T_MODELISATION_3D",
          subFolders: [
            "Modèle HBIM complet",
            "Exports IFC",
            "Maquettes de phases",
            "Simulations structurelles",
            "Rendus 3D",
            "Coupes virtuelles annotées",
            "Visites virtuelles",
            "Modèles impression 3D",
          ],
        },
        {
          tableName: "T_CARTOGRAPHIE_ETAT",
          subFolders: [
            "Carte des désordres structurels",
            "Cartographie des fissures",
            "Relevé des lacunes",
            "Carte des zones humides",
            "Cartographie des matériaux",
            "État sanitaire global",
            "Carte interventions antérieures",
            "Zonage des priorités",
          ],
        },
      ],
    },
    {
      bddCategory: "BDD_FINANCIER",
      label: "BDD_FINANCIER",
      tables: [
        { tableName: "T_SITUATIONS", subFolders: ["DECOMPTE_1", "DECOMPTE_2", "DECOMPTE_3"] },
        { tableName: "T_TRAVAUX_SUPPLEMENTAIRES", subFolders: ["GENERAL"] },
        { tableName: "T_RECLAMATIONS", subFolders: ["GENERAL"] },
        { tableName: "T_COMPTABILITE_CHANTIER", subFolders: ["GENERAL"] },
      ],
    },
    {
      bddCategory: "BDD_ARCHEO",
      label: "BDD_ARCHEO",
      tables: [
        { tableName: "T_FICHE_INVENTAIRE", subFolders: ["GENERAL"] },
        { tableName: "T_RAPPORTS_FOUILLES", subFolders: ["GENERAL"] },
        { tableName: "T_STRATIGRAPHIE", subFolders: ["GENERAL"] },
        { tableName: "T_SOURCES_HISTORIQUES", subFolders: ["GENERAL"] },
      ],
    },
    {
      bddCategory: "BDD_QUALITE",
      label: "BDD_QUALITE",
      tables: [
        { tableName: "T_PAQ", subFolders: ["GENERAL"] },
        { tableName: "T_CONTROLES_EXECUTION", subFolders: ["GENERAL"] },
        { tableName: "T_RECEPTIONS", subFolders: ["GENERAL"] },
      ],
    },
  ],
} as const;

export function documentFolderPath(
  bddCategory: string,
  tableName: string,
  subFolder?: string | null,
): string {
  return subFolder ? `${bddCategory}/${tableName}/${subFolder}` : `${bddCategory}/${tableName}`;
}
