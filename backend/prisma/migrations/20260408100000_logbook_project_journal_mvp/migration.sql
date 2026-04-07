-- Journal (Logbook) MVP: project-level only — no zone links; code + eventAt + description + workforce

DROP TABLE IF EXISTS "LogbookZone";

ALTER TABLE "Logbook" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Logbook" ADD COLUMN IF NOT EXISTS "description" TEXT;

UPDATE "Logbook" l
SET "code" = x.n
FROM (
  SELECT id, 'JRN-' || LPAD(ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "entryDate")::text, 4, '0') AS n
  FROM "Logbook"
) x
WHERE l.id = x.id;

UPDATE "Logbook" SET "description" = CASE
  WHEN "summary" IS NOT NULL AND "body" IS NOT NULL AND TRIM(COALESCE("body", '')) <> '' THEN "summary" || E'\n' || "body"
  WHEN "summary" IS NOT NULL THEN "summary"
  WHEN "body" IS NOT NULL THEN "body"
  ELSE NULL
END;

ALTER TABLE "Logbook" DROP COLUMN IF EXISTS "summary";
ALTER TABLE "Logbook" DROP COLUMN IF EXISTS "body";

ALTER TABLE "Logbook" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Logbook_projectId_code_key" ON "Logbook"("projectId", "code");

ALTER TABLE "Logbook" RENAME COLUMN "entryDate" TO "eventAt";
ALTER TABLE "Logbook" RENAME COLUMN "workforceCount" TO "workforce";
