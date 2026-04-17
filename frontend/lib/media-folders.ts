export const MEDIA_BDD_CATEGORY = "BDD_MEDIA";

export const MEDIA_FOLDER_CONFIG = {
  bddCategory: MEDIA_BDD_CATEGORY,
  tables: [
    {
      tableName: "T_REPORTAGES_PHOTO",
      label: "T_REPORTAGES PHOTO",
      subFolders: [
        "PHOTOS_ETAT_INITIAL",
        "PHOTOS_SUIVI",
        "PHOTOS_ETAT_FINAL",
        "PHOTOS_DRONE",
        "PHOTOS_DETAILS_TECHNIQUES",
        "PHOTOS_PATHOLOGIES",
        "PHOTOS_EQUIPES",
        "PHOTOS_VISITES_OFFICIELLES",
      ],
    },
    {
      tableName: "T_VIDEOS_DRONES",
      label: "T_VIDEOS DRONES",
      subFolders: [
        "VIDEOS_SURVOL",
        "TIMELAPSE",
        "VIDEOS_INSPECTION",
        "VIDEOS_PEDAGOGIQUES",
        "INTERVIEWS",
        "CAPTATIONS_OFFICIELLES",
        "VIDEOS_360",
      ],
    },
    {
      tableName: "T_CROQUIS_CARNETS",
      label: "T_CROQUIS CARNETS",
      subFolders: [
        "SCANS_TERRAIN",
        "CROQUIS",
        "SCHEMAS",
        "ANNOTATIONS_PLANS",
        "DESSINS_MANUELS",
        "PLANCHES_VISUELLES",
      ],
    },
    {
      tableName: "T_COMMUNICATION",
      label: "T_COMMUNICATION",
      subFolders: [
        "COMMUNIQUES",
        "DOSSIERS_PRESSE",
        "PLAQUETTES",
        "POSTERS",
        "PRESENTATIONS",
        "ARTICLES",
      ],
    },
  ],
} as const;

export function mediaFolderPath(tableName: string, subFolder: string): string {
  return `${MEDIA_BDD_CATEGORY}/${tableName}/${subFolder}`;
}

export function mediaHumanLabel(value: string): string {
  return value.replace(/^T_/, "").replace(/_/g, " ").trim();
}
