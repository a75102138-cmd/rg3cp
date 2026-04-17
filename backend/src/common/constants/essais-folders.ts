export const ESSAIS_BDD_CATEGORY = 'MATERIAUX';

export const ESSAIS_FOLDER_CONFIG = {
  bddCategory: ESSAIS_BDD_CATEGORY,
  tables: {
    T_ANALYSES_CARACTERISATION: [
      'non valides',
      'rapport essais',
      'Resultats Briques',
      'Resultats Beton',
    ],
    T_ESSAIS_CONVENANCE: [
      'PV_AGREMENT/Dossier PV chantier',
      'PV_AGREMENT/LSR',
      'PV_AGREMENT/LPEE',
      'Essaie de compactage',
    ],
    T_FICHES_TECHNIQUES: ['Fiches Techniques Chaux', 'autres FT'],
    T_PROVENANCE: ['Bons de livraison'],
  },
} as const;

export function isEssaisBddCategory(value?: string | null): boolean {
  return value === ESSAIS_BDD_CATEGORY;
}

export function isValidEssaisFolder(tableName: string, subFolder?: string | null): boolean {
  if (!subFolder?.trim()) return false;
  const table = ESSAIS_FOLDER_CONFIG.tables[tableName as keyof typeof ESSAIS_FOLDER_CONFIG.tables] as
    | readonly string[]
    | undefined;
  if (!table) return false;
  return table.includes(subFolder.trim());
}
