ALTER TABLE "Photo"
  ADD COLUMN IF NOT EXISTS "dateFolder" TEXT;

CREATE INDEX IF NOT EXISTS "Photo_dateFolder_idx" ON "Photo"("dateFolder");
