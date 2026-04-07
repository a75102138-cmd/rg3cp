-- Element: matériau en texte libre (plus de FK vers Material)

ALTER TABLE "Element" ADD COLUMN IF NOT EXISTS "material" TEXT;

UPDATE "Element" e
SET "material" = TRIM(CONCAT(COALESCE(m."code", ''), CASE WHEN m."name" IS NOT NULL AND TRIM(m."name") <> '' THEN ' — ' || m."name" ELSE '' END))
FROM "Material" m
WHERE e."materialId" IS NOT NULL AND e."materialId" = m.id;

ALTER TABLE "Element" DROP CONSTRAINT IF EXISTS "Element_materialId_fkey";
DROP INDEX IF EXISTS "Element_materialId_idx";
ALTER TABLE "Element" DROP COLUMN IF EXISTS "materialId";
