-- DropTable (RETEX removed from MVP domain)
DROP TABLE IF EXISTS "Retex";

-- Ensure required startDate before NOT NULL
UPDATE "Project" SET "startDate" = "createdAt" WHERE "startDate" IS NULL;

-- Narrow ProjectStatus enum (DRAFT/ARCHIVED → PLANNED/COMPLETED)
CREATE TYPE "ProjectStatus_new" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED');

ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'PLANNED'::"ProjectStatus_new"
    WHEN 'ARCHIVED' THEN 'COMPLETED'::"ProjectStatus_new"
    ELSE "status"::text::"ProjectStatus_new"
  END
);

ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PLANNED'::"ProjectStatus_new";

DROP TYPE "ProjectStatus";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";

-- Rename endDate → plannedEndDate
ALTER TABLE "Project" RENAME COLUMN "endDate" TO "plannedEndDate";

-- Drop ownerName (not part of MVP Project)
ALTER TABLE "Project" DROP COLUMN IF EXISTS "ownerName";

ALTER TABLE "Project" ALTER COLUMN "startDate" SET NOT NULL;
