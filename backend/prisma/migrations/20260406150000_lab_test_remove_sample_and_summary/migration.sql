-- Remove non-MVP lab test fields
ALTER TABLE "LabTest" DROP COLUMN IF EXISTS "sampleRef";
ALTER TABLE "LabTest" DROP COLUMN IF EXISTS "resultSummary";
