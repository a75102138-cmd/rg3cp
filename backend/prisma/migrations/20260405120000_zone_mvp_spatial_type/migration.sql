-- Zone MVP: drop plan de référence / tri, sensibilité CRITICAL, types spatiaux, colonne `type`

-- 1) Délier les plans de référence zone
UPDATE "Zone" SET "referencePlanId" = NULL WHERE "referencePlanId" IS NOT NULL;
ALTER TABLE "Zone" DROP CONSTRAINT IF EXISTS "Zone_referencePlanId_fkey";
ALTER TABLE "Zone" DROP COLUMN IF EXISTS "sortOrder";
ALTER TABLE "Zone" DROP COLUMN IF EXISTS "referencePlanId";

-- 2) HeritageSensitivity : EXCEPTIONAL → CRITICAL
CREATE TYPE "HeritageSensitivity_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
ALTER TABLE "Zone" ALTER COLUMN "heritageSensitivity" DROP DEFAULT;
ALTER TABLE "Zone" ALTER COLUMN "heritageSensitivity" TYPE "HeritageSensitivity_new" USING (
  CASE
    WHEN "heritageSensitivity" IS NULL THEN NULL::"HeritageSensitivity_new"
    WHEN "heritageSensitivity"::text = 'EXCEPTIONAL' THEN 'CRITICAL'::"HeritageSensitivity_new"
    WHEN "heritageSensitivity"::text = 'LOW' THEN 'LOW'::"HeritageSensitivity_new"
    WHEN "heritageSensitivity"::text = 'MEDIUM' THEN 'MEDIUM'::"HeritageSensitivity_new"
    WHEN "heritageSensitivity"::text = 'HIGH' THEN 'HIGH'::"HeritageSensitivity_new"
    ELSE NULL
  END
);
DROP TYPE "HeritageSensitivity";
ALTER TYPE "HeritageSensitivity_new" RENAME TO "HeritageSensitivity";

-- 3) Nouveau enum spatial + colonne `type`
CREATE TYPE "ZoneType_new" AS ENUM (
  'WALL',
  'ARCADE',
  'TALUS',
  'MUSEUM',
  'COLUMN',
  'PERIPHERAL_WALL',
  'ROOM',
  'SECTION',
  'OTHER'
);

ALTER TABLE "Zone" ADD COLUMN "type" "ZoneType_new";

UPDATE "Zone" SET "type" = (
  CASE "zoneType"::text
    WHEN 'BUILDING' THEN 'ROOM'::"ZoneType_new"
    WHEN 'FACADE' THEN 'WALL'::"ZoneType_new"
    WHEN 'STRUCTURE' THEN 'COLUMN'::"ZoneType_new"
    WHEN 'INTERIOR_SPACE' THEN 'ROOM'::"ZoneType_new"
    WHEN 'SITE' THEN 'SECTION'::"ZoneType_new"
    WHEN 'SUB_ZONE' THEN 'SECTION'::"ZoneType_new"
    WHEN 'TECHNICAL_AREA' THEN 'OTHER'::"ZoneType_new"
    WHEN 'OTHER' THEN 'OTHER'::"ZoneType_new"
    ELSE 'OTHER'::"ZoneType_new"
  END
);

ALTER TABLE "Zone" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "Zone" DROP COLUMN "zoneType";
DROP TYPE "ZoneType";
ALTER TYPE "ZoneType_new" RENAME TO "ZoneType";
