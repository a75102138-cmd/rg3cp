export const RISK_BDD_CATEGORIES = ['BDD_SECURITE'] as const;
export type RiskBddCategory = (typeof RISK_BDD_CATEGORIES)[number];

export const RISK_FOLDER_CONFIG = {
  bdds: {
    BDD_SECURITE: {
      tables: {
        T_SECURITE_CHANTIER: ['GENERAL'],
        T_ENVIRONNEMENT: ['GENERAL'],
        T_ACCES_SITE: ['GENERAL'],
      },
    },
  },
} as const;

export function isRiskBddCategory(value?: string | null): value is RiskBddCategory {
  return Boolean(value && RISK_BDD_CATEGORIES.includes(value as RiskBddCategory));
}

export function isValidRiskTable(bddCategory: string, tableName: string): boolean {
  if (!isRiskBddCategory(bddCategory)) return false;
  return Boolean(RISK_FOLDER_CONFIG.bdds[bddCategory].tables[tableName as keyof typeof RISK_FOLDER_CONFIG.bdds.BDD_SECURITE.tables]);
}

export function isValidRiskFolder(bddCategory: string, tableName: string, subFolder?: string | null): boolean {
  if (!isValidRiskTable(bddCategory, tableName)) return false;
  if (!subFolder?.trim()) return false;
  const tableFolders =
    RISK_FOLDER_CONFIG.bdds[bddCategory as RiskBddCategory].tables[
      tableName as keyof typeof RISK_FOLDER_CONFIG.bdds.BDD_SECURITE.tables
    ] as readonly string[] | undefined;
  return Boolean(tableFolders?.includes(subFolder.trim()));
}
