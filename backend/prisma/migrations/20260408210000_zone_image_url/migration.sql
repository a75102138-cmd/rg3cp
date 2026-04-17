-- Couverture zone (URL Cloudinary)
ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
