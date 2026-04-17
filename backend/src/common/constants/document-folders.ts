export const DOCUMENT_FOLDER_CONFIG = {
  bdds: {
    BDD_ADMIN: {
      tables: {
        T_CONTRATS: [
          {
            name: 'Marché public initial',
            children: ['CPS', 'CCAG', 'CCAP', 'C3G'],
          },
          'Contrat',
          {
            name: 'Conventions de sous-traitance',
            children: [
              'Convention ARCHÉOLOGUE',
              'Convention Geo tech topo',
              'Convention ITT Mouad Mesbahi',
            ],
          },
          'Contrats des Maâlems (artisans traditionnels)',
          'Actes d’engagement',
          'Bordereaux des prix unitaires (BPU)',
        ],
        T_ORDRES_SERVICE: [
          'OS de commencement des travaux',
          'OS de notification de lancement',
          'OS d’approbation du marché',
          'OS d’arrêt de chantier (avec motifs)',
          'OS de reprise des travaux',
        ],
        T_COURRIERS: [
          'Lettres de mise en demeure',
          'Lettres de réclamation',
          'Demandes de prorogation de délai',
          'Notifications de difficultés imprévues',
          'Réponses aux observations de la MOA',
          'Courriers de réserve technique',
          'Accusés de réception (scans)',
        ],
        T_ASSURANCES: [
          'Police TRC (Tous Risques Chantier)',
          'Caution d’avance',
          'Attestation RC professionnelle',
          'Caution définitive',
          'Caution de retenue de garantie',
          'Attestations CNSS',
          'Attestations fiscales',
          'Garanties décennales',
          'Certificats d’assurance des sous-traitants',
        ],
        T_RESSOURCES_HUMAINES: [
          'Trombinoscope équipe projet',
          'CV des experts et chefs de lot',
          'Planning des affectations',
          'Registres de pointage',
        ],
        T_PLANNING: [
          'Planning initial contractuel',
          'Planning recalé (versions successives)',
          'Chemins critiques identifiés',
          'Analyses des retards',
          'Calendriers des intempéries',
        ],
      },
    },
    BDD_DOCTRINE: {
      tables: {
        T_CHARTES_INTERNATIONALES: ['GENERAL'],
        T_NORMES_TECHNIQUES: ['GENERAL'],
        T_NOTES_POSITIONNEMENT: ['GENERAL'],
      },
    },
    BDD_PLANS: {
      tables: {
        T_RELEVES_SOURCES: [
          'Nuages de points',
          'Orthophotographies HD',
          'Scans Leica',
          'Relevés photogrammétriques',
          'Levés topographiques',
          'Relevés pierre à pierre',
          'Cartographie des désordres',
          'Thermographies infrarouge',
        ],
        T_PLANS_EXECUTION: [
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
        T_MODELISATION_3D: [
          'Modèle HBIM complet',
          'Exports IFC',
          'Maquettes de phases',
          'Simulations structurelles',
          'Rendus 3D',
          'Coupes virtuelles annotées',
          'Visites virtuelles',
          'Modèles impression 3D',
        ],
        T_CARTOGRAPHIE_ETAT: [
          'Carte des désordres structurels',
          'Cartographie des fissures',
          'Relevé des lacunes',
          'Carte des zones humides',
          'Cartographie des matériaux',
          'État sanitaire global',
          'Carte interventions antérieures',
          'Zonage des priorités',
        ],
      },
    },
    BDD_FINANCIER: {
      tables: {
        T_SITUATIONS: ['DECOMPTE_1', 'DECOMPTE_2', 'DECOMPTE_3'],
        T_TRAVAUX_SUPPLEMENTAIRES: ['GENERAL'],
        T_RECLAMATIONS: ['GENERAL'],
        T_COMPTABILITE_CHANTIER: ['GENERAL'],
      },
    },
    BDD_ARCHEO: {
      tables: {
        T_FICHE_INVENTAIRE: ['GENERAL'],
        T_RAPPORTS_FOUILLES: ['GENERAL'],
        T_STRATIGRAPHIE: ['GENERAL'],
        T_SOURCES_HISTORIQUES: ['GENERAL'],
      },
    },
    BDD_QUALITE: {
      tables: {
        T_PAQ: ['GENERAL'],
        T_CONTROLES_EXECUTION: ['GENERAL'],
        T_RECEPTIONS: ['GENERAL'],
      },
    },
  },
} as const;

type FolderNode = string | { name: string; children: readonly FolderNode[] };

function collectFolderPaths(nodes: readonly FolderNode[], parent = ''): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    if (typeof node === 'string') {
      const full = parent ? `${parent}/${node}` : node;
      out.push(full);
      continue;
    }
    const full = parent ? `${parent}/${node.name}` : node.name;
    out.push(full);
    out.push(...collectFolderPaths(node.children, full));
  }
  return out;
}

export type DocumentBddCategory = keyof typeof DOCUMENT_FOLDER_CONFIG.bdds;
export type DocumentTableName = keyof (typeof DOCUMENT_FOLDER_CONFIG.bdds)[DocumentBddCategory]['tables'];

export function isValidDocumentFolder(
  bddCategory: string,
  tableName: string,
  subFolder: string,
): boolean {
  const bdd = DOCUMENT_FOLDER_CONFIG.bdds[bddCategory as DocumentBddCategory];
  if (!bdd) return false;
  const table = bdd.tables[tableName as keyof typeof bdd.tables] as readonly FolderNode[] | undefined;
  if (!table) return false;
  return collectFolderPaths(table).includes(subFolder);
}

export function buildDocumentFolderPath(
  bddCategory: string,
  tableName: string,
  subFolder?: string | null,
): string {
  return subFolder ? `${bddCategory}/${tableName}/${subFolder}` : `${bddCategory}/${tableName}`;
}
