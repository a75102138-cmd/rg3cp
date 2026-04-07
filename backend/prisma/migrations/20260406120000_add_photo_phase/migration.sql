-- CreateEnum
CREATE TYPE "PhotoPhase" AS ENUM ('AVANT', 'PENDANT', 'APRES');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN "photoPhase" "PhotoPhase";
