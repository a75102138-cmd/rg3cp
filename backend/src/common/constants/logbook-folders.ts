export const LOGBOOK_BDD_CATEGORY = 'BDD_LOGBOOK';

export const LOGBOOK_FOLDER_CONFIG = {
  bddCategory: LOGBOOK_BDD_CATEGORY,
  tables: {
    T_PV_CHANTIER: ['LES_PV', 'PVS_TAPES', 'PVS_TINMEL', 'PV_MANIFOLD'],
    T_FICHES_ZONES: ['GENERAL'],
    T_METEO_CONDITIONS: ['GENERAL'],
    T_INCIDENTS: ['GENERAL'],
    T_JOURNAL_QUOTIDIEN: ['GENERAL'],
  },
} as const;

export function isValidLogbookFolder(tableName: string, subFolder?: string | null): boolean {
  const table = LOGBOOK_FOLDER_CONFIG.tables[tableName as keyof typeof LOGBOOK_FOLDER_CONFIG.tables];
  if (!table) return false;
  if (!subFolder?.trim()) return true;
  const raw = subFolder.trim();
  if (table.includes(raw as never)) return true;
  if (raw.startsWith('PV_MANIFOLD/')) {
    const datePart = raw.slice('PV_MANIFOLD/'.length);
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart);
  }
  return false;
}
