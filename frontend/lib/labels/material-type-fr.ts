export const MATERIAL_TYPES = [
  "STONE",
  "BRICK",
  "WOOD",
  "METAL",
  "GLASS",
  "CERAMIC",
  "MORTAR",
  "CONCRETE",
  "EARTH",
  "OTHER",
] as const;

export const MATERIAL_TYPE_LABEL_FR: Record<(typeof MATERIAL_TYPES)[number], string> = {
  STONE: "Pierre",
  BRICK: "Brique",
  WOOD: "Bois",
  METAL: "Métal",
  GLASS: "Verre",
  CERAMIC: "Céramique",
  MORTAR: "Mortier",
  CONCRETE: "Béton",
  EARTH: "Terre",
  OTHER: "Autre",
};
