-- Actor foundation
CREATE TYPE "ActorRole" AS ENUM (
  'OWNER',
  'ARCHITECT',
  'COMPANY',
  'LABORATORY',
  'ENGINEERING_OFFICE',
  'EXPERT',
  'ADMINISTRATION',
  'CONTRACTOR',
  'OTHER'
);

CREATE TABLE "Actor" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "organization" TEXT,
  "role" "ActorRole" NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Actor_code_key" ON "Actor"("code");

-- Project actor references
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "maitreOuvrageActorId" UUID;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "architectActorId" UUID;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "companyActorId" UUID;
CREATE INDEX IF NOT EXISTS "Project_maitreOuvrageActorId_idx" ON "Project"("maitreOuvrageActorId");
CREATE INDEX IF NOT EXISTS "Project_architectActorId_idx" ON "Project"("architectActorId");
CREATE INDEX IF NOT EXISTS "Project_companyActorId_idx" ON "Project"("companyActorId");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_maitreOuvrageActorId_fkey"
  FOREIGN KEY ("maitreOuvrageActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_architectActorId_fkey"
  FOREIGN KEY ("architectActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_companyActorId_fkey"
  FOREIGN KEY ("companyActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Observation / Intervention / LabTest / Document / Photo / Logbook
ALTER TABLE "Observation" ADD COLUMN IF NOT EXISTS "authorActorId" UUID;
CREATE INDEX IF NOT EXISTS "Observation_authorActorId_idx" ON "Observation"("authorActorId");
ALTER TABLE "Observation"
  ADD CONSTRAINT "Observation_authorActorId_fkey"
  FOREIGN KEY ("authorActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Intervention" ADD COLUMN IF NOT EXISTS "companyActorId" UUID;
CREATE INDEX IF NOT EXISTS "Intervention_companyActorId_idx" ON "Intervention"("companyActorId");
ALTER TABLE "Intervention"
  ADD CONSTRAINT "Intervention_companyActorId_fkey"
  FOREIGN KEY ("companyActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LabTest" ADD COLUMN IF NOT EXISTS "laboratoryActorId" UUID;
CREATE INDEX IF NOT EXISTS "LabTest_laboratoryActorId_idx" ON "LabTest"("laboratoryActorId");
ALTER TABLE "LabTest"
  ADD CONSTRAINT "LabTest_laboratoryActorId_fkey"
  FOREIGN KEY ("laboratoryActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "authorActorId" UUID;
CREATE INDEX IF NOT EXISTS "Document_authorActorId_idx" ON "Document"("authorActorId");
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_authorActorId_fkey"
  FOREIGN KEY ("authorActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "authorActorId" UUID;
CREATE INDEX IF NOT EXISTS "Photo_authorActorId_idx" ON "Photo"("authorActorId");
ALTER TABLE "Photo"
  ADD CONSTRAINT "Photo_authorActorId_fkey"
  FOREIGN KEY ("authorActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Logbook" ADD COLUMN IF NOT EXISTS "authorActorId" UUID;
CREATE INDEX IF NOT EXISTS "Logbook_authorActorId_idx" ON "Logbook"("authorActorId");
ALTER TABLE "Logbook"
  ADD CONSTRAINT "Logbook_authorActorId_fkey"
  FOREIGN KEY ("authorActorId") REFERENCES "Actor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
