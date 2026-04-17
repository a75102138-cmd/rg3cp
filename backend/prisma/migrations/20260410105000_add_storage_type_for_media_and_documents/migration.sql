-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('CLOUDINARY', 'B2');

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "storageType" "StorageType" NOT NULL DEFAULT 'CLOUDINARY';

-- AlterTable
ALTER TABLE "Photo"
ADD COLUMN "storageType" "StorageType" NOT NULL DEFAULT 'CLOUDINARY';
