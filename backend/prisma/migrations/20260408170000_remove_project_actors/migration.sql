-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_maitreOuvrageActorId_fkey";
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_architectActorId_fkey";
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_companyActorId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Project_maitreOuvrageActorId_idx";
DROP INDEX IF EXISTS "Project_architectActorId_idx";
DROP INDEX IF EXISTS "Project_companyActorId_idx";

-- AlterTable
ALTER TABLE "Project"
  DROP COLUMN IF EXISTS "maitreOuvrageActorId",
  DROP COLUMN IF EXISTS "architectActorId",
  DROP COLUMN IF EXISTS "companyActorId";
