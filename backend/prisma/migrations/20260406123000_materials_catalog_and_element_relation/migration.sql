-- Materials: required enum type + origin naming
CREATE TYPE "MaterialType" AS ENUM (
  'STONE',
  'BRICK',
  'WOOD',
  'METAL',
  'GLASS',
  'CERAMIC',
  'MORTAR',
  'CONCRETE',
  'EARTH',
  'OTHER'
);

ALTER TABLE "Material"
ADD COLUMN "type_new" "MaterialType";

UPDATE "Material"
SET "type_new" = CASE
  WHEN "type" IN ('STONE','BRICK','WOOD','METAL','GLASS','CERAMIC','MORTAR','CONCRETE','EARTH','OTHER')
    THEN "type"::"MaterialType"
  ELSE 'OTHER'::"MaterialType"
END;

ALTER TABLE "Material"
ALTER COLUMN "type_new" SET NOT NULL;

ALTER TABLE "Material"
DROP COLUMN "type";

ALTER TABLE "Material"
RENAME COLUMN "type_new" TO "type";

ALTER TABLE "Material"
DROP COLUMN IF EXISTS "description";

-- Elements: replace free-text material with relation to Material
ALTER TABLE "Element"
ADD COLUMN "materialId" UUID;

CREATE INDEX "Element_materialId_idx" ON "Element"("materialId");

ALTER TABLE "Element"
ADD CONSTRAINT "Element_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "Material"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Element"
DROP COLUMN IF EXISTS "material";
