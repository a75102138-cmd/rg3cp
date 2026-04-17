-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UploadScope" AS ENUM ('PROJECT', 'ZONE');

-- AlterEnum (UserRole)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'UPLOADER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VALIDATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';

-- AlterTable Document
ALTER TABLE "Document"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'BDD_ADMIN',
  ADD COLUMN "subCategory" TEXT,
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "scope" "UploadScope" NOT NULL DEFAULT 'PROJECT',
  ADD COLUMN "uploadedById" UUID,
  ADD COLUMN "validatedById" UUID,
  ADD COLUMN "validatedAt" TIMESTAMP(3),
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "relatedZoneId" UUID;

-- AlterTable Photo
ALTER TABLE "Photo"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'BDD_MEDIA',
  ADD COLUMN "subCategory" TEXT,
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "scope" "UploadScope" NOT NULL DEFAULT 'PROJECT',
  ADD COLUMN "uploadedById" UUID,
  ADD COLUMN "validatedById" UUID,
  ADD COLUMN "validatedAt" TIMESTAMP(3),
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "relatedZoneId" UUID;

-- Foreign keys
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Document_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Document_relatedZoneId_fkey" FOREIGN KEY ("relatedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Photo"
  ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Photo_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Photo_relatedZoneId_fkey" FOREIGN KEY ("relatedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_category_idx" ON "Document"("category");
CREATE INDEX "Document_relatedZoneId_idx" ON "Document"("relatedZoneId");
CREATE INDEX "Document_validatedAt_idx" ON "Document"("validatedAt");
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");
CREATE INDEX "Document_validatedById_idx" ON "Document"("validatedById");

CREATE INDEX "Photo_status_idx" ON "Photo"("status");
CREATE INDEX "Photo_category_idx" ON "Photo"("category");
CREATE INDEX "Photo_relatedZoneId_idx" ON "Photo"("relatedZoneId");
CREATE INDEX "Photo_validatedAt_idx" ON "Photo"("validatedAt");
CREATE INDEX "Photo_uploadedById_idx" ON "Photo"("uploadedById");
CREATE INDEX "Photo_validatedById_idx" ON "Photo"("validatedById");
