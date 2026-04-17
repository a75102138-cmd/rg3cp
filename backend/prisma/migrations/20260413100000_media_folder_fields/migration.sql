ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "bddCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "tableName" TEXT,
  ADD COLUMN IF NOT EXISTS "subFolder" TEXT,
  ADD COLUMN IF NOT EXISTS "folderPath" TEXT;

ALTER TABLE "Photo"
  ADD COLUMN IF NOT EXISTS "bddCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "tableName" TEXT,
  ADD COLUMN IF NOT EXISTS "subFolder" TEXT,
  ADD COLUMN IF NOT EXISTS "folderPath" TEXT;

CREATE INDEX IF NOT EXISTS "Document_bddCategory_idx" ON "Document"("bddCategory");
CREATE INDEX IF NOT EXISTS "Document_tableName_idx" ON "Document"("tableName");
CREATE INDEX IF NOT EXISTS "Document_subFolder_idx" ON "Document"("subFolder");
CREATE INDEX IF NOT EXISTS "Document_folderPath_idx" ON "Document"("folderPath");

CREATE INDEX IF NOT EXISTS "Photo_bddCategory_idx" ON "Photo"("bddCategory");
CREATE INDEX IF NOT EXISTS "Photo_tableName_idx" ON "Photo"("tableName");
CREATE INDEX IF NOT EXISTS "Photo_subFolder_idx" ON "Photo"("subFolder");
CREATE INDEX IF NOT EXISTS "Photo_folderPath_idx" ON "Photo"("folderPath");
