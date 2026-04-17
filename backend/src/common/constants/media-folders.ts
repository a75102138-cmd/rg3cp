export const MEDIA_BDD_CATEGORY = 'BDD_MEDIA';

export const MEDIA_FOLDER_CONFIG = {
  bddCategory: MEDIA_BDD_CATEGORY,
  tables: {
    T_REPORTAGES_PHOTO: [
      'PHOTOS_ETAT_INITIAL',
      'PHOTOS_SUIVI',
      'PHOTOS_ETAT_FINAL',
      'PHOTOS_DRONE',
      'PHOTOS_DETAILS_TECHNIQUES',
      'PHOTOS_PATHOLOGIES',
      'PHOTOS_EQUIPES',
      'PHOTOS_VISITES_OFFICIELLES',
    ],
    T_VIDEOS_DRONES: [
      'VIDEOS_SURVOL',
      'TIMELAPSE',
      'VIDEOS_INSPECTION',
      'VIDEOS_PEDAGOGIQUES',
      'INTERVIEWS',
      'CAPTATIONS_OFFICIELLES',
      'VIDEOS_360',
    ],
    T_CROQUIS_CARNETS: [
      'SCANS_TERRAIN',
      'CROQUIS',
      'SCHEMAS',
      'ANNOTATIONS_PLANS',
      'DESSINS_MANUELS',
      'PLANCHES_VISUELLES',
    ],
    T_COMMUNICATION: [
      'COMMUNIQUES',
      'DOSSIERS_PRESSE',
      'PLAQUETTES',
      'POSTERS',
      'PRESENTATIONS',
      'ARTICLES',
    ],
  },
} as const;

export type MediaTableName = keyof typeof MEDIA_FOLDER_CONFIG.tables;
export type MediaSubFolder = (typeof MEDIA_FOLDER_CONFIG.tables)[MediaTableName][number];

export function buildMediaFolderPath(
  bddCategory: string,
  tableName: string,
  subFolder: string,
): string {
  return `${bddCategory}/${tableName}/${subFolder}`;
}

export function isValidMediaFolder(tableName: string, subFolder: string): boolean {
  const key = tableName as MediaTableName;
  const folders = MEDIA_FOLDER_CONFIG.tables[key];
  if (!folders) return false;
  return (folders as readonly string[]).includes(subFolder);
}
