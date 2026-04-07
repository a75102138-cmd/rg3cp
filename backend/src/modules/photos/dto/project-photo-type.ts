/** Types métier pour photos globales projet (stockés en `photoType`, dossiers Cloudinary via slug). */
export const PROJECT_PHOTO_TYPES = [
  'VUE_GLOBALE',
  'DRONE',
  'EVENEMENT',
  'VISITE',
  'SUIVI_CHANTIER',
  'INTEMPERIES',
  'AUTRE',
] as const;

export type ProjectPhotoType = (typeof PROJECT_PHOTO_TYPES)[number];
